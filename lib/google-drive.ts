import { google } from "googleapis"
import { PassThrough } from "stream"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
]

const VIDEO_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
]

// Build a styled HTML document for Google Docs conversion.
// Google Drive's HTML-to-Doc converter respects inline CSS, so we add
// styles that match the Tailwind prose-sm spacing used in the viewer.
function buildStyledHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
  }
  h1 {
    font-size: 22pt;
    margin-top: 0pt;
    margin-bottom: 12pt;
    line-height: 1.3;
  }
  h2 {
    font-size: 16pt;
    margin-top: 20pt;
    margin-bottom: 8pt;
    line-height: 1.3;
  }
  h3 {
    font-size: 13pt;
    margin-top: 16pt;
    margin-bottom: 6pt;
    line-height: 1.3;
  }
  p {
    margin-top: 0pt;
    margin-bottom: 10pt;
    line-height: 1.6;
  }
  ul, ol {
    margin-top: 8pt;
    margin-bottom: 12pt;
    padding-left: 24pt;
  }
  li {
    margin-top: 0pt;
    margin-bottom: 6pt;
    line-height: 1.6;
  }
  hr {
    margin-top: 16pt;
    margin-bottom: 16pt;
    border: none;
    border-top: 1pt solid #cccccc;
  }
  strong {
    font-weight: bold;
  }
  em {
    font-style: italic;
  }
</style>
</head>
<body>${content}</body>
</html>`
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl(subAccountId: string): string {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: subAccountId,
    prompt: "consent",
  })
}

export async function handleCallback(code: string, subAccountId: string) {
  const client = getOAuth2Client()
  const { tokens } = await client.getToken(code)

  const encrypted = encrypt(JSON.stringify(tokens))

  await prisma.subAccount.update({
    where: { id: subAccountId },
    data: { googleDriveTokens: encrypted },
  })

  return tokens
}

export async function getAuthenticatedClient(subAccountId: string) {
  const subAccount = await prisma.subAccount.findUnique({
    where: { id: subAccountId },
    select: { googleDriveTokens: true },
  })

  if (!subAccount?.googleDriveTokens) {
    throw new Error("Google Drive not connected for this sub-account")
  }

  const tokens = JSON.parse(decrypt(subAccount.googleDriveTokens))
  const client = getOAuth2Client()
  client.setCredentials(tokens)

  // Handle token refresh
  client.on("tokens", async (newTokens) => {
    const merged = { ...tokens, ...newTokens }
    const encrypted = encrypt(JSON.stringify(merged))
    await prisma.subAccount.update({
      where: { id: subAccountId },
      data: { googleDriveTokens: encrypted },
    })
  })

  return client
}

export async function listFolders(subAccountId: string, parentId?: string) {
  const authClient = await getAuthenticatedClient(subAccountId)
  const drive = google.drive({ version: "v3", auth: authClient })

  const query = parentId
    ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    orderBy: "name",
    pageSize: 100,
  })

  return res.data.files || []
}

export async function createGoogleDoc(
  subAccountId: string,
  title: string,
  content: string,
  folderId?: string
) {
  const authClient = await getAuthenticatedClient(subAccountId)
  const drive = google.drive({ version: "v3", auth: authClient })

  const htmlBody = buildStyledHtml(title, content)

  const fileMetadata: Record<string, unknown> = {
    name: title,
    mimeType: "application/vnd.google-apps.document",
  }

  if (folderId) {
    fileMetadata.parents = [folderId]
  }

  const bufferStream = new PassThrough()
  bufferStream.end(Buffer.from(htmlBody, "utf-8"))

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType: "text/html",
      body: bufferStream,
    },
    fields: "id, webViewLink",
  })

  return {
    docId: file.data.id!,
    docUrl: file.data.webViewLink!,
  }
}

// ─── Video Project Drive Helpers ─────────────────────

export function getVideoAuthUrl(videoProjectId: string): string {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: "offline",
    scope: VIDEO_SCOPES,
    state: `video:${videoProjectId}`,
    prompt: "consent",
  })
}

export async function handleVideoCallback(code: string, videoProjectId: string) {
  const client = getOAuth2Client()
  const { tokens } = await client.getToken(code)

  const encrypted = encrypt(JSON.stringify(tokens))

  await prisma.videoProject.update({
    where: { id: videoProjectId },
    data: { googleDriveTokens: encrypted },
  })

  return tokens
}

export async function getVideoAuthenticatedClient(videoProjectId: string) {
  const project = await prisma.videoProject.findUnique({
    where: { id: videoProjectId },
    select: { googleDriveTokens: true },
  })

  if (!project?.googleDriveTokens) {
    throw new Error("Google Drive not connected for this video project")
  }

  const tokens = JSON.parse(decrypt(project.googleDriveTokens))
  const client = getOAuth2Client()
  client.setCredentials(tokens)

  client.on("tokens", async (newTokens) => {
    const merged = { ...tokens, ...newTokens }
    const encrypted = encrypt(JSON.stringify(merged))
    await prisma.videoProject.update({
      where: { id: videoProjectId },
      data: { googleDriveTokens: encrypted },
    })
  })

  return client
}

export async function listVideoFolders(videoProjectId: string, parentId?: string) {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const drive = google.drive({ version: "v3", auth: authClient })

  const query = parentId
    ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    orderBy: "name",
    pageSize: 100,
  })

  return res.data.files || []
}

export async function createVideoGoogleDoc(
  videoProjectId: string,
  title: string,
  content: string,
  folderId?: string
) {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const drive = google.drive({ version: "v3", auth: authClient })

  const htmlBody = buildStyledHtml(title, content)

  const fileMetadata: Record<string, unknown> = {
    name: title,
    mimeType: "application/vnd.google-apps.document",
  }

  if (folderId) {
    fileMetadata.parents = [folderId]
  }

  const bufferStream = new PassThrough()
  bufferStream.end(Buffer.from(htmlBody, "utf-8"))

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType: "text/html",
      body: bufferStream,
    },
    fields: "id, webViewLink",
  })

  return {
    docId: file.data.id!,
    docUrl: file.data.webViewLink!,
  }
}

export async function createVideoSubfolder(
  videoProjectId: string,
  folderName: string,
  parentFolderId: string
) {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const drive = google.drive({ version: "v3", auth: authClient })

  const file = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  })

  return file.data.id!
}

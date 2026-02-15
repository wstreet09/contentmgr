import { google } from "googleapis"
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getVideoAuthenticatedClient } from "@/lib/google-drive"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"

/**
 * Extract a Google Drive file ID from various URL formats.
 * Supports: /file/d/ID, /open?id=ID, id=ID query param
 */
export function parseDriveFileId(url: string): string | null {
  try {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileMatch) return fileMatch[1]

    // Format: https://drive.google.com/open?id=FILE_ID
    const parsed = new URL(url)
    const idParam = parsed.searchParams.get("id")
    if (idParam) return idParam

    return null
  } catch {
    return null
  }
}

/**
 * Download a video file from Google Drive to a temp file.
 * Returns the temp file path and mime type.
 */
async function downloadFromDrive(
  videoProjectId: string,
  driveFileId: string
): Promise<{ tempPath: string; mimeType: string; fileName: string }> {
  const authClient = await getVideoAuthenticatedClient(videoProjectId)
  const drive = google.drive({ version: "v3", auth: authClient })

  // Get file metadata
  const meta = await drive.files.get({
    fileId: driveFileId,
    fields: "name, mimeType",
  })

  const mimeType = meta.data.mimeType || "video/mp4"
  const fileName = meta.data.name || "video.mp4"

  // Download file
  const res = await drive.files.get(
    { fileId: driveFileId, alt: "media" },
    { responseType: "stream" }
  )

  const tempPath = path.join(os.tmpdir(), `video-${driveFileId}-${Date.now()}`)

  await new Promise<void>((resolve, reject) => {
    const dest = fs.createWriteStream(tempPath)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(res.data as any).pipe(dest)
    dest.on("finish", resolve)
    dest.on("error", reject)
  })

  return { tempPath, mimeType, fileName }
}

/**
 * Transcribe a video using Gemini's File API.
 * Downloads from Drive, uploads to Gemini, returns transcription text.
 */
export async function transcribeVideo(
  driveFileId: string,
  videoProjectId: string,
  geminiApiKey: string
): Promise<string> {
  let tempPath: string | null = null

  try {
    // Download video from Drive
    const { tempPath: downloaded, mimeType, fileName } = await downloadFromDrive(
      videoProjectId,
      driveFileId
    )
    tempPath = downloaded

    // Upload to Gemini File API
    const fileManager = new GoogleAIFileManager(geminiApiKey)
    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType,
      displayName: fileName,
    })

    // Wait for file processing
    let file = uploadResult.file
    while (file.state === FileState.PROCESSING) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      const check = await fileManager.getFile(file.name)
      file = check
    }

    if (file.state === FileState.FAILED) {
      throw new Error("Gemini file processing failed")
    }

    // Generate transcription
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        },
      },
      {
        text: "Transcribe the spoken content of this video. Provide only the transcription text, no timestamps or speaker labels. If there is no spoken content, describe the key visual content.",
      },
    ])

    return result.response.text()
  } finally {
    // Clean up temp file
    if (tempPath) {
      try {
        fs.unlinkSync(tempPath)
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

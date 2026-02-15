import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { createAdapter, LLMProvider } from "@/lib/llm/adapter"
import { buildHooksPrompt } from "@/lib/llm/video-prompts"
import { createVideoGoogleDoc } from "@/lib/google-drive"
import { writeSheetCell } from "@/lib/google-sheets"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoProjectId, provider, model } = (await req.json()) as {
    videoProjectId: string
    provider: LLMProvider
    model?: string
  }

  if (!videoProjectId || !provider) {
    return NextResponse.json(
      { error: "videoProjectId and provider are required" },
      { status: 400 }
    )
  }

  // Fetch project
  const project = await prisma.videoProject.findUnique({
    where: { id: videoProjectId },
    select: {
      name: true,
      teamId: true,
      googleDriveFolderId: true,
      googleDriveTokens: true,
      sheetId: true,
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Verify team membership
  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: project.teamId },
  })
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Get topics
  const topics = await prisma.videoTopic.findMany({
    where: { videoProjectId },
    orderBy: { createdAt: "asc" },
  })

  if (topics.length === 0) {
    return NextResponse.json(
      { error: "No topics found. Add topics first." },
      { status: 400 }
    )
  }

  // Get user's API key
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { encryptedApiKeys: true },
  })
  if (!user?.encryptedApiKeys) {
    return NextResponse.json(
      { error: "No API keys configured. Go to Settings > API Keys." },
      { status: 400 }
    )
  }
  const keys = JSON.parse(decrypt(user.encryptedApiKeys))
  const apiKey = keys[provider]
  if (!apiKey) {
    return NextResponse.json(
      { error: `No ${provider} API key configured` },
      { status: 400 }
    )
  }

  // Build prompt and call LLM
  const prompt = buildHooksPrompt({
    topics: topics.map((t) => t.title),
    projectName: project.name,
  })

  const adapter = await createAdapter(provider, apiKey, model)
  const result = await adapter.generate({
    prompt,
    maxTokens: 4000,
    temperature: 0.7,
  })

  const htmlContent = result.content

  // Create Google Doc if Drive is connected
  let docId: string | undefined
  let docUrl: string | undefined

  if (project.googleDriveTokens && project.googleDriveFolderId) {
    try {
      const doc = await createVideoGoogleDoc(
        videoProjectId,
        `${project.name} Video Topics w/ Hooks`,
        htmlContent,
        project.googleDriveFolderId
      )
      docId = doc.docId
      docUrl = doc.docUrl

      // Update Sheet Column B with doc URL if sheet exists
      if (project.sheetId && docUrl) {
        await writeSheetCell(videoProjectId, project.sheetId, "B", 2, docUrl)
      }
    } catch {
      // Non-fatal: hooks content still returned
    }
  }

  // Save doc reference on project
  if (docId && docUrl) {
    await prisma.videoProject.update({
      where: { id: videoProjectId },
      data: { hooksDocId: docId, hooksDocUrl: docUrl },
    })
  }

  // Update all topics to COMPLETED hook status
  await prisma.videoTopic.updateMany({
    where: { videoProjectId },
    data: { hookStatus: "COMPLETED" },
  })

  return NextResponse.json({
    data: {
      content: htmlContent,
      docId,
      docUrl,
      topicsUpdated: topics.length,
    },
  })
}

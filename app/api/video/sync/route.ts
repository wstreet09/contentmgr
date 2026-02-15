import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { createAdapter } from "@/lib/llm/adapter"
import { buildMiniBlogPrompt } from "@/lib/llm/video-prompts"
import { readSheetColumn, writeSheetCell } from "@/lib/google-sheets"
import { createVideoGoogleDoc, createVideoSubfolder } from "@/lib/google-drive"
import { transcribeVideo, parseDriveFileId } from "@/lib/video-transcribe"

export const maxDuration = 300 // 5 minutes for long sync operations

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoProjectId } = (await req.json()) as {
    videoProjectId: string
  }

  if (!videoProjectId) {
    return NextResponse.json(
      { error: "videoProjectId is required" },
      { status: 400 }
    )
  }

  // Fetch project
  const project = await prisma.videoProject.findUnique({
    where: { id: videoProjectId },
    select: {
      name: true,
      teamId: true,
      sheetId: true,
      googleDriveFolderId: true,
      googleDriveTokens: true,
      miniBlogsFolderId: true,
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

  if (!project.sheetId) {
    return NextResponse.json(
      { error: "No tracking sheet found. Create one in Settings first." },
      { status: 400 }
    )
  }

  if (!project.googleDriveTokens || !project.googleDriveFolderId) {
    return NextResponse.json(
      { error: "Google Drive not connected." },
      { status: 400 }
    )
  }

  // Get user's Gemini API key (needed for transcription)
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
  const geminiKey = keys.gemini
  if (!geminiKey) {
    return NextResponse.json(
      { error: "Gemini API key required for video transcription. Configure it in Settings > API Keys." },
      { status: 400 }
    )
  }

  // Get topics from DB
  const topics = await prisma.videoTopic.findMany({
    where: { videoProjectId },
    orderBy: { createdAt: "asc" },
  })

  if (topics.length === 0) {
    return NextResponse.json(
      { error: "No topics found." },
      { status: 400 }
    )
  }

  // Read Sheet Column C (Video Link) - rows 2 onwards (skip header)
  const videoLinks = await readSheetColumn(
    videoProjectId,
    project.sheetId,
    "C",
    2,
    topics.length + 1
  )

  // Find topics that have a video link but no mini-blog yet
  const toProcess: Array<{
    topic: (typeof topics)[0]
    videoLink: string
    sheetRow: number
  }> = []

  for (let i = 0; i < topics.length; i++) {
    const link = videoLinks[i]?.trim()
    if (link && topics[i].miniBlogStatus !== "COMPLETED") {
      toProcess.push({
        topic: topics[i],
        videoLink: link,
        sheetRow: i + 2, // 1-indexed, skip header
      })
    }
  }

  if (toProcess.length === 0) {
    return NextResponse.json({
      data: { processed: 0, message: "No new videos to process." },
    })
  }

  // Ensure Mini Blogs subfolder exists
  let miniBlogsFolderId = project.miniBlogsFolderId
  if (!miniBlogsFolderId) {
    miniBlogsFolderId = await createVideoSubfolder(
      videoProjectId,
      "Mini Blogs",
      project.googleDriveFolderId
    )
    await prisma.videoProject.update({
      where: { id: videoProjectId },
      data: { miniBlogsFolderId },
    })
  }

  // Process each video
  const results: Array<{ title: string; success: boolean; error?: string }> = []

  for (const item of toProcess) {
    try {
      // Parse Drive file ID from video link
      const driveFileId = parseDriveFileId(item.videoLink)
      if (!driveFileId) {
        results.push({
          title: item.topic.title,
          success: false,
          error: "Could not parse Drive file ID from video link",
        })
        continue
      }

      // Transcribe video
      const transcription = await transcribeVideo(
        driveFileId,
        videoProjectId,
        geminiKey
      )

      // Save transcription on topic
      await prisma.videoTopic.update({
        where: { id: item.topic.id },
        data: { transcription, videoLink: item.videoLink },
      })

      // Generate mini-blog
      const prompt = buildMiniBlogPrompt({
        transcription,
        topicTitle: item.topic.title,
        projectName: project.name,
      })

      // Use Gemini for the mini-blog too since we already have the key
      const adapter = await createAdapter("gemini", geminiKey)
      const blogResult = await adapter.generate({
        prompt,
        maxTokens: 4000,
        temperature: 0.7,
      })

      // Create Google Doc in Mini Blogs subfolder
      const doc = await createVideoGoogleDoc(
        videoProjectId,
        item.topic.title,
        blogResult.content,
        miniBlogsFolderId
      )

      // Update topic with doc reference
      await prisma.videoTopic.update({
        where: { id: item.topic.id },
        data: {
          miniBlogStatus: "COMPLETED",
          miniBlogDocId: doc.docId,
          miniBlogDocUrl: doc.docUrl,
        },
      })

      // Update Sheet Column F with doc URL
      if (project.sheetId) {
        await writeSheetCell(
          videoProjectId,
          project.sheetId,
          "F",
          item.sheetRow,
          doc.docUrl
        )
      }

      results.push({ title: item.topic.title, success: true })
    } catch (err) {
      results.push({
        title: item.topic.title,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const successCount = results.filter((r) => r.success).length

  return NextResponse.json({
    data: {
      processed: toProcess.length,
      succeeded: successCount,
      failed: toProcess.length - successCount,
      results,
    },
  })
}

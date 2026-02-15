import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { createAdapter, LLMProvider } from "@/lib/llm/adapter"
import { buildVideoTopicPrompt } from "@/lib/llm/video-prompts"
import { scanYouTubeChannel } from "@/lib/youtube-scan"
import { appendSheetRows } from "@/lib/google-sheets"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoProjectId, count, provider, topicDirection } = (await req.json()) as {
    videoProjectId: string
    count: number
    provider: LLMProvider
    topicDirection?: string
  }

  if (!videoProjectId || !count || !provider) {
    return NextResponse.json(
      { error: "videoProjectId, count, and provider are required" },
      { status: 400 }
    )
  }

  const topicCount = Math.min(Math.max(count, 1), 20)

  // Fetch video project
  const project = await prisma.videoProject.findUnique({
    where: { id: videoProjectId },
    select: {
      name: true,
      youtubeChannelUrl: true,
      teamId: true,
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

  // Scan YouTube channel for existing video titles
  let existingYouTubeTopics: string[] = []
  if (project.youtubeChannelUrl) {
    const videos = await scanYouTubeChannel(project.youtubeChannelUrl)
    existingYouTubeTopics = videos.map((v) => v.title)
  }

  // Get existing table topics
  const existingItems = await prisma.videoTopic.findMany({
    where: { videoProjectId },
    select: { title: true },
  })
  const existingTableTopics = existingItems
    .map((i) => i.title)
    .filter((t) => t.trim().length > 0)

  // Build prompt and call LLM
  const prompt = buildVideoTopicPrompt({
    count: topicCount,
    projectName: project.name,
    topicDirection,
    existingYouTubeTopics,
    existingTableTopics,
  })

  const adapter = await createAdapter(provider, apiKey)
  const result = await adapter.generate({
    prompt,
    maxTokens: 2000,
    temperature: 0.8,
  })

  // Parse JSON response
  let topics: Array<{ title: string }>
  try {
    let jsonStr = result.content.trim()
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }
    topics = JSON.parse(jsonStr)
    if (!Array.isArray(topics)) {
      throw new Error("Response is not an array")
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response. Please try again." },
      { status: 500 }
    )
  }

  // Write topics to Sheet Column A if sheet exists
  if (project.sheetId) {
    try {
      const sheetRows = topics.map((t) => [t.title])
      await appendSheetRows(videoProjectId, project.sheetId, sheetRows)
    } catch {
      // Non-fatal: topics still returned even if sheet write fails
    }
  }

  return NextResponse.json({ data: topics })
}

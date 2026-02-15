import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { createAdapter, LLMProvider } from "@/lib/llm/adapter"
import { buildTopicSuggestionPrompt } from "@/lib/llm/prompts"
import { scrapeSitemap } from "@/lib/scrape-sitemap"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subAccountId, count, provider, sitemapUrl, topicDirection } = (await req.json()) as {
    subAccountId: string
    count: number
    provider: LLMProvider
    sitemapUrl?: string
    topicDirection?: string
  }

  if (!subAccountId || !count || !provider) {
    return NextResponse.json(
      { error: "subAccountId, count, and provider are required" },
      { status: 400 }
    )
  }

  const topicCount = Math.min(Math.max(count, 1), 20)

  // Fetch sub-account data
  const subAccount = await prisma.subAccount.findUnique({
    where: { id: subAccountId },
    select: {
      name: true,
      url: true,
      companyType: true,
      city: true,
      state: true,
      project: { select: { teamId: true } },
    },
  })

  if (!subAccount) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  }

  // Verify team membership
  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: subAccount.project.teamId },
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

  // Scrape sitemap for existing blog topics
  let websiteTopics: string[] = []
  if (sitemapUrl) {
    const entries = await scrapeSitemap(sitemapUrl)
    websiteTopics = entries.map((e) => e.title)
  } else if (subAccount.url) {
    const entries = await scrapeSitemap(subAccount.url)
    websiteTopics = entries.map((e) => e.title)
  }

  // Get existing content table titles
  const existingItems = await prisma.contentItem.findMany({
    where: { subAccountId },
    select: { title: true },
  })
  const existingTableTopics = existingItems
    .map((i) => i.title)
    .filter((t): t is string => !!t && t.trim().length > 0)

  // Build prompt and call LLM
  const prompt = buildTopicSuggestionPrompt({
    count: topicCount,
    businessName: subAccount.name,
    companyType: subAccount.companyType || undefined,
    city: subAccount.city || undefined,
    state: subAccount.state || undefined,
    existingWebsiteTopics: websiteTopics,
    existingTableTopics,
    topicDirection,
  })

  const adapter = await createAdapter(provider, apiKey)
  const result = await adapter.generate({
    prompt,
    maxTokens: 2000,
    temperature: 0.8,
  })

  // Parse JSON response
  let topics: Array<{ title: string; targetKeywords?: string; targetAudience?: string }>
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

  return NextResponse.json({ data: topics })
}

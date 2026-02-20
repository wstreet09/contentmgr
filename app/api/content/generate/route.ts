import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { waitUntil } from "@vercel/functions"

// Allow up to 300s for background processing on Vercel (Pro plan)
export const maxDuration = 300
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { createAdapter, LLMProvider, LLMAdapter } from "@/lib/llm/adapter"
import { buildContentPrompt } from "@/lib/llm/prompts"
import { createGoogleDoc } from "@/lib/google-drive"
import { scrapeSitemap } from "@/lib/scrape-sitemap"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subAccountId, itemIds, provider, model, wordCount, templatePrompt, exampleContent, customPromptInstruction } = (await req.json()) as {
    subAccountId: string
    itemIds: string[]
    provider: LLMProvider
    model?: string
    wordCount?: number
    templatePrompt?: string
    exampleContent?: string
    customPromptInstruction?: string
  }

  if (!subAccountId || !itemIds?.length || !provider) {
    return NextResponse.json(
      { error: "subAccountId, itemIds, and provider are required" },
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

  // Get sub-account info
  const subAccount = await prisma.subAccount.findUnique({
    where: { id: subAccountId },
    select: {
      name: true,
      phone: true,
      url: true,
      contactUrl: true,
      internalLinks: true,
      googleDriveFolderId: true,
      googleDriveTokens: true,
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

  // Gather internal links: scraped from sitemap + manual
  let allInternalLinks: { url: string; title: string }[] = []
  if (subAccount.url) {
    try {
      const scraped = await scrapeSitemap(subAccount.url)
      allInternalLinks = scraped.map((e) => ({ url: e.url, title: e.title }))
    } catch {
      // Non-fatal: continue without scraped links
    }
  }
  if (subAccount.internalLinks) {
    try {
      const manual = JSON.parse(subAccount.internalLinks) as { url: string; title: string }[]
      allInternalLinks = [...allInternalLinks, ...manual]
    } catch {
      // ignore invalid JSON
    }
  }
  // Filter out category/tag/archive pages, deduplicate by URL, and cap at 50
  const categoryPatterns = ["/category/", "/tag/", "/archive/", "/author/", "/page/"]
  const seen = new Set<string>()
  allInternalLinks = allInternalLinks.filter((link) => {
    if (seen.has(link.url)) return false
    if (categoryPatterns.some((p) => link.url.includes(p))) return false
    seen.add(link.url)
    return true
  }).slice(0, 50)

  // Create batch
  const batch = await prisma.contentBatch.create({
    data: {
      subAccountId,
      totalItems: itemIds.length,
      status: "PROCESSING",
      startedAt: new Date(),
    },
  })

  // Link items to batch and set them to QUEUED
  await prisma.contentItem.updateMany({
    where: { id: { in: itemIds } },
    data: {
      batchId: batch.id,
      status: "QUEUED",
    },
  })

  // Return immediately so the client can show progress
  // Processing continues in the background
  const batchId = batch.id
  const driveFolderId = subAccount.googleDriveFolderId

  // Process items in the background — waitUntil keeps Vercel function alive after response
  waitUntil(processItemsInBackground({
    batchId, itemIds, provider, apiKey, model,
    businessName: subAccount.name,
    businessPhone: subAccount.phone,
    contactUrl: subAccount.contactUrl,
    driveFolderId, subAccountId,
    wordCount, templatePrompt, exampleContent, customPromptInstruction,
    internalLinks: allInternalLinks,
  }).catch(console.error))

  return NextResponse.json({ data: { batchId } })
}

async function processItemsInBackground(opts: {
  batchId: string
  itemIds: string[]
  provider: LLMProvider
  apiKey: string
  model?: string
  businessName: string
  businessPhone: string | null
  contactUrl: string | null
  driveFolderId: string | null
  subAccountId: string
  wordCount?: number
  templatePrompt?: string
  exampleContent?: string
  customPromptInstruction?: string
  internalLinks: { url: string; title: string }[]
}) {
  const items = await prisma.contentItem.findMany({
    where: { id: { in: opts.itemIds } },
  })

  const adapter = await createAdapter(opts.provider, opts.apiKey, opts.model)

  // Process items in parallel (3 at a time) to stay within Vercel time limits
  const CONCURRENCY = 3
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const chunk = items.slice(i, i + CONCURRENCY)
    await Promise.allSettled(chunk.map((item) => processOneItem(item, adapter, opts)))
  }

  // Mark batch as completed after all items processed
  const finalBatch = await prisma.contentBatch.findUnique({
    where: { id: opts.batchId },
    select: { failedItems: true, totalItems: true },
  })
  const allFailed = finalBatch && finalBatch.failedItems === finalBatch.totalItems
  await prisma.contentBatch.update({
    where: { id: opts.batchId },
    data: {
      status: allFailed ? "FAILED" : "COMPLETED",
      completedAt: new Date(),
    },
  })
}

async function processOneItem(
  item: { id: string; title: string; contentType: string; serviceArea: string | null; targetAudience: string | null; geolocation: string | null; targetKeywords: string | null; includeCta: boolean },
  adapter: LLMAdapter,
  opts: { batchId: string; businessName: string; businessPhone: string | null; contactUrl: string | null; driveFolderId: string | null; subAccountId: string; wordCount?: number; templatePrompt?: string; exampleContent?: string; customPromptInstruction?: string; internalLinks: { url: string; title: string }[] }
) {
  await prisma.contentItem.update({
    where: { id: item.id },
    data: { status: "GENERATING" },
  })

  try {
    const prompt = buildContentPrompt({
      title: item.title,
      contentType: item.contentType,
      serviceArea: item.serviceArea || undefined,
      targetAudience: item.targetAudience || undefined,
      geolocation: item.geolocation || undefined,
      targetKeywords: item.targetKeywords || undefined,
      includeCta: item.includeCta,
      businessName: opts.businessName,
      businessPhone: opts.businessPhone || undefined,
      contactPageUrl: opts.contactUrl || undefined,
      wordCount: opts.wordCount,
      templatePrompt: opts.templatePrompt,
      exampleContent: opts.exampleContent,
      customPromptInstruction: opts.customPromptInstruction,
      internalLinks: opts.internalLinks,
    })

    const raw = await adapter.generate({ prompt })
    const result = {
      ...raw,
      content: raw.content.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/i, "").trim(),
    }

    if (!result.content) {
      throw new Error("LLM returned empty content. Try a different model.")
    }

    let googleDocId: string | undefined
    let googleDocUrl: string | undefined
    try {
      if (opts.driveFolderId) {
        const doc = await createGoogleDoc(
          opts.subAccountId,
          item.title,
          result.content,
          opts.driveFolderId
        )
        googleDocId = doc.docId
        googleDocUrl = doc.docUrl
      }
    } catch (driveErr) {
      console.error("Google Drive upload error:", driveErr)
    }

    await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        generatedContent: result.content,
        status: "COMPLETED",
        ...(googleDocId && { googleDocId }),
        ...(googleDocUrl && { googleDocUrl }),
      },
    })

    await prisma.contentBatch.update({
      where: { id: opts.batchId },
      data: { completedItems: { increment: 1 } },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        status: "FAILED",
        errorMessage,
        retryCount: { increment: 1 },
      },
    })
    await prisma.contentBatch.update({
      where: { id: opts.batchId },
      data: { failedItems: { increment: 1 } },
    })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { createAdapter, LLMProvider } from "@/lib/llm/adapter"
import { buildContentPrompt } from "@/lib/llm/prompts"
import { createGoogleDoc } from "@/lib/google-drive"

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

  // Get the items to process
  const items = await prisma.contentItem.findMany({
    where: { id: { in: itemIds } },
  })

  // Process each item directly
  const adapter = await createAdapter(provider, apiKey, model)

  for (const item of items) {
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
        businessName: subAccount.name,
        wordCount,
        templatePrompt,
        exampleContent,
        customPromptInstruction,
      })

      const raw = await adapter.generate({ prompt })
      // Strip markdown code fences (```html ... ```) if present
      const result = {
        ...raw,
        content: raw.content.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/i, "").trim(),
      }

      // Guard: if content is empty, mark as FAILED
      if (!result.content) {
        throw new Error("LLM returned empty content. Try a different model.")
      }

      // Upload to Google Drive if connected
      let googleDocId: string | undefined
      let googleDocUrl: string | undefined
      try {
        if (subAccount.googleDriveFolderId) {
          const doc = await createGoogleDoc(
            subAccountId,
            item.title,
            result.content,
            subAccount.googleDriveFolderId
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
        where: { id: batch.id },
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
        where: { id: batch.id },
        data: { failedItems: { increment: 1 } },
      })
    }
  }

  // Mark batch as completed
  const finalBatch = await prisma.contentBatch.findUnique({
    where: { id: batch.id },
    select: { failedItems: true, totalItems: true },
  })
  const allFailed = finalBatch && finalBatch.failedItems === finalBatch.totalItems
  await prisma.contentBatch.update({
    where: { id: batch.id },
    data: {
      status: allFailed ? "FAILED" : "COMPLETED",
      completedAt: new Date(),
    },
  })

  return NextResponse.json({ data: { batchId: batch.id } })
}

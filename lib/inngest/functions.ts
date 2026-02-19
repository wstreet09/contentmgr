import { inngest } from "./client"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { createAdapter, LLMProvider } from "@/lib/llm/adapter"
import { buildContentPrompt } from "@/lib/llm/prompts"
import { createGoogleDoc } from "@/lib/google-drive"

export const generateContentBatch = inngest.createFunction(
  {
    id: "generate-content-batch",
    retries: 0, // We handle retries per-item inside
  },
  { event: "content/batch.generate" },
  async ({ event, step }) => {
    const { batchId, userId, provider } = event.data as {
      batchId: string
      userId: string
      provider: LLMProvider
    }

    // Mark batch as processing
    await step.run("mark-batch-processing", async () => {
      await prisma.contentBatch.update({
        where: { id: batchId },
        data: { status: "PROCESSING", startedAt: new Date() },
      })
    })

    // Get the user's API key
    const apiKey = await step.run("get-api-key", async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { encryptedApiKeys: true },
      })
      if (!user?.encryptedApiKeys) throw new Error("No API keys configured")
      const keys = JSON.parse(decrypt(user.encryptedApiKeys))
      const key = keys[provider]
      if (!key) throw new Error(`No ${provider} API key configured`)
      return key as string
    })

    // Get batch items and sub-account info
    const { items, businessName, businessPhone, contactPageUrl, subAccountId, driveFolderId } = await step.run("get-batch-data", async () => {
      const batch = await prisma.contentBatch.findUnique({
        where: { id: batchId },
        include: {
          items: { where: { status: "QUEUED" } },
          subAccount: { select: { name: true, phone: true, contactUrl: true, id: true, googleDriveFolderId: true, googleDriveTokens: true } },
        },
      })
      if (!batch) throw new Error("Batch not found")
      return {
        items: batch.items,
        businessName: batch.subAccount.name,
        businessPhone: batch.subAccount.phone,
        contactPageUrl: batch.subAccount.contactUrl,
        subAccountId: batch.subAccount.id,
        driveFolderId: batch.subAccount.googleDriveFolderId,
        hasDrive: !!batch.subAccount.googleDriveTokens,
      }
    })

    // Process each item individually
    for (const item of items) {
      await step.run(`generate-item-${item.id}`, async () => {
        // Mark item as generating
        await prisma.contentItem.update({
          where: { id: item.id },
          data: { status: "GENERATING" },
        })

        try {
          const adapter = await createAdapter(provider, apiKey)
          const prompt = buildContentPrompt({
            title: item.title,
            contentType: item.contentType,
            serviceArea: item.serviceArea || undefined,
            targetAudience: item.targetAudience || undefined,
            geolocation: item.geolocation || undefined,
            targetKeywords: item.targetKeywords || undefined,
            includeCta: item.includeCta,
            businessName,
            businessPhone: businessPhone || undefined,
            contactPageUrl: contactPageUrl || undefined,
          })

          const result = await adapter.generate({ prompt })

          // Upload to Google Drive if connected
          let googleDocId: string | undefined
          let googleDocUrl: string | undefined
          try {
            if (driveFolderId) {
              const doc = await createGoogleDoc(
                subAccountId,
                item.title,
                result.content,
                driveFolderId
              )
              googleDocId = doc.docId
              googleDocUrl = doc.docUrl
            }
          } catch {
            // Drive upload failure shouldn't fail the item
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
            where: { id: batchId },
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
            where: { id: batchId },
            data: { failedItems: { increment: 1 } },
          })
        }
      })
    }

    // Mark batch as completed
    await step.run("mark-batch-complete", async () => {
      const batch = await prisma.contentBatch.findUnique({
        where: { id: batchId },
        select: { failedItems: true, totalItems: true },
      })
      const allFailed = batch && batch.failedItems === batch.totalItems
      await prisma.contentBatch.update({
        where: { id: batchId },
        data: {
          status: allFailed ? "FAILED" : "COMPLETED",
          completedAt: new Date(),
        },
      })
    })

    return { batchId, status: "done" }
  }
)

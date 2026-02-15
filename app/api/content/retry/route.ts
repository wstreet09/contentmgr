import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest/client"
import { LLMProvider } from "@/lib/llm/adapter"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { batchId, provider } = (await req.json()) as {
    batchId: string
    provider: LLMProvider
  }

  if (!batchId || !provider) {
    return NextResponse.json(
      { error: "batchId and provider are required" },
      { status: 400 }
    )
  }

  // Get failed items for this batch
  const failedItems = await prisma.contentItem.findMany({
    where: { batchId, status: "FAILED" },
    select: { id: true },
  })

  if (failedItems.length === 0) {
    return NextResponse.json({ error: "No failed items to retry" }, { status: 400 })
  }

  // Reset failed items to QUEUED
  await prisma.contentItem.updateMany({
    where: { batchId, status: "FAILED" },
    data: { status: "QUEUED", errorMessage: null },
  })

  // Update batch counters
  await prisma.contentBatch.update({
    where: { id: batchId },
    data: {
      status: "PROCESSING",
      failedItems: 0,
      completedAt: null,
    },
  })

  // Send Inngest event
  await inngest.send({
    name: "content/batch.generate",
    data: {
      batchId,
      userId: session.user.id,
      provider,
    },
  })

  return NextResponse.json({ data: { batchId, retrying: failedItems.length } })
}

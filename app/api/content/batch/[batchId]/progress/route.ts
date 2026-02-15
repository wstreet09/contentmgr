import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      let done = false
      while (!done) {
        const batch = await prisma.contentBatch.findUnique({
          where: { id: params.batchId },
          select: {
            status: true,
            totalItems: true,
            completedItems: true,
            failedItems: true,
          },
        })

        if (!batch) {
          send({ error: "Batch not found" })
          done = true
          break
        }

        send({
          status: batch.status,
          totalItems: batch.totalItems,
          completedItems: batch.completedItems,
          failedItems: batch.failedItems,
        })

        if (["COMPLETED", "FAILED", "CANCELLED"].includes(batch.status)) {
          done = true
          break
        }

        // Wait 2 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

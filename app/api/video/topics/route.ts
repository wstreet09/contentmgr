import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const videoProjectId = req.nextUrl.searchParams.get("videoProjectId")
  if (!videoProjectId) {
    return NextResponse.json(
      { error: "videoProjectId is required" },
      { status: 400 }
    )
  }

  const topics = await prisma.videoTopic.findMany({
    where: { videoProjectId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ data: topics })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoProjectId, items } = await req.json()

  if (!videoProjectId || !Array.isArray(items)) {
    return NextResponse.json(
      { error: "videoProjectId and items array required" },
      { status: 400 }
    )
  }

  // Only process PENDING items — non-PENDING items are managed by generation pipelines
  const pendingItems = items.filter(
    (item: { hookStatus: string; videoLink?: string }) =>
      item.hookStatus === "PENDING" && !item.videoLink
  )
  const pendingIds = pendingItems.map((item: { id: string }) => item.id)

  await prisma.$transaction(async (tx) => {
    // Delete pending items not in the incoming list (user removed them)
    await tx.videoTopic.deleteMany({
      where: {
        videoProjectId,
        hookStatus: "PENDING",
        descriptionStatus: "PENDING",
        miniBlogStatus: "PENDING",
        ...(pendingIds.length > 0 ? { id: { notIn: pendingIds } } : {}),
      },
    })

    // Upsert each incoming item
    for (const item of items) {
      await tx.videoTopic.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          title: item.title,
          videoProjectId,
        },
        update: {
          title: item.title,
        },
      })
    }
  })

  const saved = await prisma.videoTopic.findMany({
    where: { videoProjectId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ data: saved })
}

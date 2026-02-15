import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subAccountId = req.nextUrl.searchParams.get("subAccountId")
  if (!subAccountId) {
    return NextResponse.json(
      { error: "subAccountId is required" },
      { status: 400 }
    )
  }

  const items = await prisma.contentItem.findMany({
    where: { subAccountId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ data: items })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subAccountId, items } = await req.json()

  if (!subAccountId || !Array.isArray(items)) {
    return NextResponse.json(
      { error: "subAccountId and items array required" },
      { status: 400 }
    )
  }

  // Only process DRAFT items — non-DRAFT items are managed by the generate pipeline
  const draftItems = items.filter(
    (item: { status: string }) => item.status === "DRAFT"
  )
  const draftIds = draftItems.map((item: { id: string }) => item.id)

  await prisma.$transaction(async (tx) => {
    // Delete DRAFT items that are no longer in the incoming list (user removed them)
    await tx.contentItem.deleteMany({
      where: {
        subAccountId,
        status: "DRAFT",
        ...(draftIds.length > 0 ? { id: { notIn: draftIds } } : {}),
      },
    })

    // Upsert each incoming DRAFT item, preserving client-generated IDs
    for (const item of draftItems) {
      const data = {
        title: item.title,
        contentType: item.contentType as "BLOG_POST" | "SERVICE_PAGE" | "LOCATION_PAGE" | "LANDING_PAGE" | "ABOUT_PAGE" | "FAQ_PAGE" | "HOW_TO_GUIDE",
        serviceArea: item.serviceArea || null,
        targetAudience: item.targetAudience || null,
        geolocation: item.geolocation || null,
        targetKeywords: item.targetKeywords || null,
        includeCta: item.includeCta ?? true,
        status: "DRAFT" as const,
      }

      await tx.contentItem.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          ...data,
          subAccountId,
        },
        update: data,
      })
    }
  })

  const saved = await prisma.contentItem.findMany({
    where: { subAccountId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ data: saved })
}

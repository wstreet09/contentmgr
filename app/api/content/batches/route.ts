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

  const batches = await prisma.contentBatch.findMany({
    where: { subAccountId },
    include: {
      items: {
        select: {
          id: true,
          title: true,
          status: true,
          errorMessage: true,
          googleDocUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ data: batches })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.featureRequestVote.findUnique({
    where: {
      featureRequestId_userId: {
        featureRequestId: params.id,
        userId: session.user.id,
      },
    },
  })

  if (existing) {
    // Unvote
    await prisma.featureRequestVote.delete({ where: { id: existing.id } })
  } else {
    // Vote
    await prisma.featureRequestVote.create({
      data: {
        featureRequestId: params.id,
        userId: session.user.id,
      },
    })
  }

  const voteCount = await prisma.featureRequestVote.count({
    where: { featureRequestId: params.id },
  })

  return NextResponse.json({
    data: { hasVoted: !existing, voteCount },
  })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const sort = searchParams.get("sort") || "trending"
  const status = searchParams.get("status") || "ALL"
  const search = searchParams.get("search") || ""

  const where = {
    ...(status !== "ALL" ? { status: status as "OPEN" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : { votes: { _count: "desc" as const } }

  const requests = await prisma.featureRequest.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { votes: true } },
      votes: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
    orderBy,
  })

  const data = requests.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    userId: r.userId,
    userName: r.user.name || r.user.email,
    createdAt: r.createdAt,
    voteCount: r._count.votes,
    hasVoted: r.votes.length > 0,
  }))

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, description } = await req.json()
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const request = await prisma.featureRequest.create({
    data: {
      title: title.trim(),
      description: (description || "").trim(),
      userId: session.user.id,
    },
  })

  return NextResponse.json({ data: request }, { status: 201 })
}

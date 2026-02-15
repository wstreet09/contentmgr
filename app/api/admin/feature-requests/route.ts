import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  })

  if (!user?.isSuperAdmin) return null
  return session.user.id
}

export async function GET() {
  const adminId = await requireSuperAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const requests = await prisma.featureRequest.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const data = requests.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    userName: r.user.name || r.user.email,
    voteCount: r._count.votes,
    createdAt: r.createdAt,
  }))

  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const adminId = await requireSuperAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id, status } = await req.json()
  if (!id || !status) {
    return NextResponse.json({ error: "ID and status required" }, { status: 400 })
  }

  const updated = await prisma.featureRequest.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: Request) {
  const adminId = await requireSuperAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  await prisma.featureRequest.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

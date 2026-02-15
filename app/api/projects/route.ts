import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id },
    select: { teamId: true },
  })

  if (!membership) {
    return NextResponse.json({ data: [] })
  }

  const projects = await prisma.project.findMany({
    where: { teamId: membership.teamId },
    include: {
      _count: { select: { subAccounts: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ data: projects })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    )
  }

  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id },
    select: { teamId: true, role: true },
  })

  if (!membership) {
    return NextResponse.json({ error: "No team found" }, { status: 400 })
  }

  if (membership.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      teamId: membership.teamId,
    },
  })

  return NextResponse.json({ data: project }, { status: 201 })
}

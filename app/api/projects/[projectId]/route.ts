import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function verifyProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  })

  if (!project) return null

  const membership = await prisma.teamMembership.findFirst({
    where: { userId, teamId: project.teamId },
  })

  if (!membership) return null

  return { project, membership }
}

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifyProjectAccess(params.projectId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      _count: { select: { subAccounts: true } },
    },
  })

  return NextResponse.json({ data: project })
}

export async function PUT(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifyProjectAccess(params.projectId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (access.membership.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const { name, description } = await req.json()

  const project = await prisma.project.update({
    where: { id: params.projectId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
    },
  })

  return NextResponse.json({ data: project })
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifyProjectAccess(params.projectId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (access.membership.role !== "OWNER" && access.membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  await prisma.project.delete({
    where: { id: params.projectId },
  })

  return NextResponse.json({ message: "Project deleted" })
}

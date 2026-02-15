import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function verifyVideoProjectAccess(videoProjectId: string, userId: string) {
  const project = await prisma.videoProject.findUnique({
    where: { id: videoProjectId },
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
  { params }: { params: { videoProjectId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifyVideoProjectAccess(params.videoProjectId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const project = await prisma.videoProject.findUnique({
    where: { id: params.videoProjectId },
    include: {
      _count: { select: { topics: true } },
    },
  })

  return NextResponse.json({ data: project })
}

export async function PUT(
  req: Request,
  { params }: { params: { videoProjectId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifyVideoProjectAccess(params.videoProjectId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (access.membership.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await req.json()
  const { name, youtubeChannelUrl, googleDriveFolderId, sheetId, sheetUrl } = body

  const project = await prisma.videoProject.update({
    where: { id: params.videoProjectId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(youtubeChannelUrl !== undefined && { youtubeChannelUrl: youtubeChannelUrl?.trim() || null }),
      ...(googleDriveFolderId !== undefined && { googleDriveFolderId: googleDriveFolderId || null }),
      ...(sheetId !== undefined && { sheetId: sheetId || null }),
      ...(sheetUrl !== undefined && { sheetUrl: sheetUrl || null }),
    },
  })

  return NextResponse.json({ data: project })
}

export async function DELETE(
  req: Request,
  { params }: { params: { videoProjectId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifyVideoProjectAccess(params.videoProjectId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (access.membership.role !== "OWNER" && access.membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  await prisma.videoProject.delete({
    where: { id: params.videoProjectId },
  })

  return NextResponse.json({ message: "Video project deleted" })
}

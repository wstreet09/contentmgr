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
    select: { teamId: true, role: true },
  })

  if (!membership) {
    return NextResponse.json({ data: [] })
  }

  const members = await prisma.teamMembership.findMany({
    where: { teamId: membership.teamId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    data: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
    })),
  })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { membershipId, role } = await req.json()

  // Get the caller's membership
  const callerMembership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id },
  })

  if (!callerMembership || (callerMembership.role !== "OWNER" && callerMembership.role !== "ADMIN")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  // Cannot change OWNER role
  const target = await prisma.teamMembership.findUnique({
    where: { id: membershipId },
  })

  if (!target || target.teamId !== callerMembership.teamId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change owner role" }, { status: 400 })
  }

  const updated = await prisma.teamMembership.update({
    where: { id: membershipId },
    data: { role },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { membershipId } = await req.json()

  const callerMembership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id },
  })

  if (!callerMembership || (callerMembership.role !== "OWNER" && callerMembership.role !== "ADMIN")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const target = await prisma.teamMembership.findUnique({
    where: { id: membershipId },
  })

  if (!target || target.teamId !== callerMembership.teamId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 })
  }

  await prisma.teamMembership.delete({ where: { id: membershipId } })

  return NextResponse.json({ message: "Member removed" })
}

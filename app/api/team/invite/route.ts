import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { email, role } = await req.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const validRoles = ["ADMIN", "MEMBER", "VIEWER"]
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Get caller's team
  const callerMembership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id },
    include: { team: true },
  })

  if (!callerMembership || (callerMembership.role !== "OWNER" && callerMembership.role !== "ADMIN")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  // Find the user by email
  const invitedUser = await prisma.user.findUnique({
    where: { email: email.trim() },
  })

  if (!invitedUser) {
    return NextResponse.json(
      { error: "No user found with that email. They must register first." },
      { status: 404 }
    )
  }

  // Check if already a member
  const existing = await prisma.teamMembership.findFirst({
    where: {
      userId: invitedUser.id,
      teamId: callerMembership.teamId,
    },
  })

  if (existing) {
    return NextResponse.json(
      { error: "User is already a team member" },
      { status: 409 }
    )
  }

  await prisma.teamMembership.create({
    data: {
      userId: invitedUser.id,
      teamId: callerMembership.teamId,
      role,
    },
  })

  return NextResponse.json(
    { message: `${invitedUser.name || invitedUser.email} added to team` },
    { status: 201 }
  )
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Fresh DB check on every request
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

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      isSuperAdmin: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ data: users })
}

export async function PUT(req: Request) {
  const adminId = await requireSuperAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id, name, email, company } = await req.json()
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { name, email, company },
    select: { id: true, name: true, email: true, company: true },
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
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  // Prevent self-deletion
  if (id === adminId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

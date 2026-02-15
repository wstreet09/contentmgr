import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only super admins can change status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  })

  if (!user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { status } = await req.json()
  const updated = await prisma.featureRequest.update({
    where: { id: params.id },
    data: { status },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const request = await prisma.featureRequest.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Only the author or a super admin can delete
  const isAuthor = request.userId === session.user.id
  if (!isAuthor) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    })
    if (!user?.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  await prisma.featureRequest.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}

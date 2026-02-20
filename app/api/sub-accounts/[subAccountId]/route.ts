import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function verifySubAccountAccess(subAccountId: string, userId: string) {
  const subAccount = await prisma.subAccount.findUnique({
    where: { id: subAccountId },
    include: { project: { select: { teamId: true } } },
  })

  if (!subAccount) return null

  const membership = await prisma.teamMembership.findFirst({
    where: { userId, teamId: subAccount.project.teamId },
  })

  if (!membership) return null

  return { subAccount, membership }
}

export async function GET(
  req: Request,
  { params }: { params: { subAccountId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifySubAccountAccess(params.subAccountId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ data: access.subAccount })
}

export async function PUT(
  req: Request,
  { params }: { params: { subAccountId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifySubAccountAccess(params.subAccountId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (access.membership.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await req.json()
  const { name, address, city, state, zip, phone, email, url, contactUrl, companyType, isPrimary, googleDriveFolderId, internalLinks } = body

  const subAccount = await prisma.subAccount.update({
    where: { id: params.subAccountId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(state !== undefined && { state: state?.trim() || null }),
      ...(zip !== undefined && { zip: zip?.trim() || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(url !== undefined && { url: url?.trim() || null }),
      ...(contactUrl !== undefined && { contactUrl: contactUrl?.trim() || null }),
      ...(companyType !== undefined && { companyType: companyType?.trim() || null }),
      ...(isPrimary !== undefined && { isPrimary }),
      ...(googleDriveFolderId !== undefined && { googleDriveFolderId: googleDriveFolderId || null }),
      ...(internalLinks !== undefined && { internalLinks: internalLinks || null }),
    },
  })

  return NextResponse.json({ data: subAccount })
}

export async function DELETE(
  req: Request,
  { params }: { params: { subAccountId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await verifySubAccountAccess(params.subAccountId, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (access.membership.role !== "OWNER" && access.membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  await prisma.subAccount.delete({
    where: { id: params.subAccountId },
  })

  return NextResponse.json({ message: "Location deleted" })
}

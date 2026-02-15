import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    )
  }

  // Verify user has access to the project's team
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: project.teamId },
  })

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const subAccounts = await prisma.subAccount.findMany({
    where: { projectId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json({ data: subAccounts })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { projectId, name, address, city, state, zip, phone, email, url, companyType } = body

  if (!projectId || !name?.trim()) {
    return NextResponse.json(
      { error: "projectId and name are required" },
      { status: 400 }
    )
  }

  // Verify access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: project.teamId },
  })

  if (!membership || membership.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  // Check if this is the first sub-account (make it primary)
  const existingCount = await prisma.subAccount.count({ where: { projectId } })

  const subAccount = await prisma.subAccount.create({
    data: {
      name: name.trim(),
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zip: zip?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      url: url?.trim() || null,
      companyType: companyType?.trim() || null,
      isPrimary: existingCount === 0,
      projectId,
    },
  })

  return NextResponse.json({ data: subAccount }, { status: 201 })
}

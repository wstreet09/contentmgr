import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subAccountId = req.nextUrl.searchParams.get("subAccountId")
  if (!subAccountId) {
    return NextResponse.json({ error: "subAccountId is required" }, { status: 400 })
  }

  const examples = await prisma.contentExample.findMany({
    where: { subAccountId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ data: examples })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subAccountId, name, content } = await req.json()

  if (!subAccountId || !name?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "subAccountId, name, and content are required" },
      { status: 400 }
    )
  }

  const example = await prisma.contentExample.create({
    data: {
      name: name.trim(),
      content: content.trim(),
      subAccountId,
    },
  })

  return NextResponse.json({ data: example }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, name, content } = await req.json()

  if (!id || !name?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "id, name, and content are required" },
      { status: 400 }
    )
  }

  const example = await prisma.contentExample.update({
    where: { id },
    data: {
      name: name.trim(),
      content: content.trim(),
    },
  })

  return NextResponse.json({ data: example })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  await prisma.contentExample.delete({ where: { id } })

  return NextResponse.json({ message: "Deleted" })
}

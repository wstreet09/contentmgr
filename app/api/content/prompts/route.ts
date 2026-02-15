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

  const prompts = await prisma.customPrompt.findMany({
    where: { subAccountId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ data: prompts })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subAccountId, name, prompt } = await req.json()

  if (!subAccountId || !name?.trim() || !prompt?.trim()) {
    return NextResponse.json(
      { error: "subAccountId, name, and prompt are required" },
      { status: 400 }
    )
  }

  const created = await prisma.customPrompt.create({
    data: {
      name: name.trim(),
      prompt: prompt.trim(),
      subAccountId,
    },
  })

  return NextResponse.json({ data: created }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, name, prompt } = await req.json()

  if (!id || !name?.trim() || !prompt?.trim()) {
    return NextResponse.json(
      { error: "id, name, and prompt are required" },
      { status: 400 }
    )
  }

  const updated = await prisma.customPrompt.update({
    where: { id },
    data: {
      name: name.trim(),
      prompt: prompt.trim(),
    },
  })

  return NextResponse.json({ data: updated })
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

  await prisma.customPrompt.delete({ where: { id } })

  return NextResponse.json({ message: "Deleted" })
}

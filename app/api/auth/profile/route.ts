import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true, company: true },
  })

  return NextResponse.json({ data: user })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, company, image } = await req.json()

  // Limit image size (~500KB base64)
  if (image && image.length > 700_000) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(company !== undefined && { company: company.trim() }),
      ...(image !== undefined && { image: image || null }),
    },
    select: { name: true, email: true, image: true, company: true },
  })

  return NextResponse.json({ data: user })
}

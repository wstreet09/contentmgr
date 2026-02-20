import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CHANGELOG } from "@/lib/changelog"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastSeenChangelogAt: true },
  })

  return NextResponse.json({
    entries: CHANGELOG,
    lastSeenAt: user?.lastSeenChangelogAt?.toISOString() || null,
  })
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenChangelogAt: new Date() },
  })

  return NextResponse.json({ success: true })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subAccountId } = await req.json()

  if (!subAccountId) {
    return NextResponse.json(
      { error: "subAccountId is required" },
      { status: 400 }
    )
  }

  await prisma.subAccount.update({
    where: { id: subAccountId },
    data: {
      googleDriveTokens: null,
      googleDriveFolderId: null,
    },
  })

  return NextResponse.json({ message: "Google Drive disconnected" })
}

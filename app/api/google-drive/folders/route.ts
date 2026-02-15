import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listFolders } from "@/lib/google-drive"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subAccountId = req.nextUrl.searchParams.get("subAccountId")
  const parentId = req.nextUrl.searchParams.get("parentId") || undefined

  if (!subAccountId) {
    return NextResponse.json(
      { error: "subAccountId is required" },
      { status: 400 }
    )
  }

  try {
    const folders = await listFolders(subAccountId, parentId)
    return NextResponse.json({ data: folders })
  } catch (error) {
    console.error("Error listing folders:", error)
    return NextResponse.json(
      { error: "Failed to list folders. Please reconnect Google Drive." },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listVideoFolders } from "@/lib/google-drive"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const videoProjectId = req.nextUrl.searchParams.get("videoProjectId")
  const parentId = req.nextUrl.searchParams.get("parentId") || undefined

  if (!videoProjectId) {
    return NextResponse.json(
      { error: "videoProjectId is required" },
      { status: 400 }
    )
  }

  try {
    const folders = await listVideoFolders(videoProjectId, parentId)
    return NextResponse.json({ data: folders })
  } catch (error) {
    console.error("Error listing folders:", error)
    return NextResponse.json(
      { error: "Failed to list folders. Please reconnect Google Drive." },
      { status: 500 }
    )
  }
}

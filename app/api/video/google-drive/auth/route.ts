import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getVideoAuthUrl } from "@/lib/google-drive"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const videoProjectId = req.nextUrl.searchParams.get("videoProjectId")
  if (!videoProjectId) {
    return NextResponse.json(
      { error: "videoProjectId is required" },
      { status: 400 }
    )
  }

  const url = getVideoAuthUrl(videoProjectId)
  return NextResponse.redirect(url)
}

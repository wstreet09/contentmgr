import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { handleCallback, handleVideoCallback } from "@/lib/google-drive"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(new URL("/article?error=drive_auth_failed", req.url))
  }

  try {
    // Video project OAuth uses "video:{id}" state prefix
    if (state.startsWith("video:")) {
      const videoProjectId = state.replace("video:", "")
      await handleVideoCallback(code, videoProjectId)
      return NextResponse.redirect(
        new URL(`/video/${videoProjectId}?tab=settings&drive_connected=true`, req.url)
      )
    }

    // Content location OAuth uses subAccountId directly
    const subAccountId = state
    await handleCallback(code, subAccountId)

    const { prisma } = await import("@/lib/prisma")
    const subAccount = await prisma.subAccount.findUnique({
      where: { id: subAccountId },
      select: { projectId: true },
    })

    if (subAccount) {
      return NextResponse.redirect(
        new URL(`/projects/${subAccount.projectId}?drive_connected=true`, req.url)
      )
    }

    return NextResponse.redirect(new URL("/article?drive_connected=true", req.url))
  } catch (error) {
    console.error("Google Drive callback error:", error)
    return NextResponse.redirect(new URL("/article?error=drive_auth_failed", req.url))
  }
}

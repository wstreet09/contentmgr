import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createTrackingSheet } from "@/lib/google-sheets"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoProjectId } = await req.json()

  if (!videoProjectId) {
    return NextResponse.json(
      { error: "videoProjectId is required" },
      { status: 400 }
    )
  }

  const project = await prisma.videoProject.findUnique({
    where: { id: videoProjectId },
    select: {
      name: true,
      teamId: true,
      googleDriveFolderId: true,
      googleDriveTokens: true,
      sheetId: true,
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Verify team membership
  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: project.teamId },
  })
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!project.googleDriveTokens) {
    return NextResponse.json(
      { error: "Google Drive not connected" },
      { status: 400 }
    )
  }

  if (!project.googleDriveFolderId) {
    return NextResponse.json(
      { error: "No Drive folder selected" },
      { status: 400 }
    )
  }

  if (project.sheetId) {
    return NextResponse.json(
      { error: "Tracking sheet already exists" },
      { status: 400 }
    )
  }

  try {
    const { sheetId, sheetUrl } = await createTrackingSheet(
      videoProjectId,
      project.name,
      project.googleDriveFolderId
    )

    await prisma.videoProject.update({
      where: { id: videoProjectId },
      data: { sheetId, sheetUrl },
    })

    return NextResponse.json({ data: { sheetId, sheetUrl } })
  } catch (error) {
    console.error("Error creating tracking sheet:", error)
    return NextResponse.json(
      { error: "Failed to create tracking sheet. Make sure Google Sheets API is enabled." },
      { status: 500 }
    )
  }
}

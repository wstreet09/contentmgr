import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

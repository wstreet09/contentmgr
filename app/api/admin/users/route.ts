import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Fresh DB check on every request
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  })

  if (!user?.isSuperAdmin) return null
  return session.user.id
}

export async function GET() {
  const adminId = await requireSuperAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      isSuperAdmin: true,
      createdAt: true,
      memberships: {
        select: {
          team: {
            select: {
              projects: {
                select: {
                  subAccounts: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Collect all sub-account IDs across all users
  const allSaIds = new Set<string>()
  for (const user of users) {
    for (const m of user.memberships) {
      for (const p of m.team.projects) {
        for (const sa of p.subAccounts) {
          allSaIds.add(sa.id)
        }
      }
    }
  }

  // Single query: count completed content items grouped by subAccountId
  const counts = await prisma.contentItem.groupBy({
    by: ["subAccountId"],
    where: {
      status: "COMPLETED",
      subAccountId: { in: Array.from(allSaIds) },
    },
    _count: true,
  })

  const saCountMap = new Map<string, number>()
  for (const c of counts) {
    if (c.subAccountId) saCountMap.set(c.subAccountId, c._count)
  }

  const data = users.map((user) => {
    let contentCount = 0
    for (const m of user.memberships) {
      for (const p of m.team.projects) {
        for (const sa of p.subAccounts) {
          contentCount += saCountMap.get(sa.id) || 0
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { memberships, ...rest } = user
    return { ...rest, contentCount }
  })

  return NextResponse.json({ data })
}

export async function PUT(req: Request) {
  const adminId = await requireSuperAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id, name, email, company } = await req.json()
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { name, email, company },
    select: { id: true, name: true, email: true, company: true },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: Request) {
  const adminId = await requireSuperAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  // Prevent self-deletion
  if (id === adminId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminUserTable } from "@/components/admin/admin-user-table"
import { AdminRequestsTable } from "@/components/admin/admin-requests-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/admin/login")

  // Fresh DB check
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  })

  if (!user?.isSuperAdmin) redirect("/admin/login")

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="border-b bg-background">
        <div className="container mx-auto flex items-center gap-3 px-6 py-4">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </div>
      </div>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminUserTable />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Feature Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminRequestsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

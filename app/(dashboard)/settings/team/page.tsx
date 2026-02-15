import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeamManagement } from "@/components/settings/team-management"

export default async function TeamSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground">
          Manage your team members and roles
        </p>
      </div>
      <TeamManagement />
    </div>
  )
}

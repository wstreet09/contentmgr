import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { VideoDashboardClient } from "./client"

export default async function VideoPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return <VideoDashboardClient />
}

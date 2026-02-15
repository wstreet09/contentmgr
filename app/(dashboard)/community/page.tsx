import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CommunityClient } from "./client"

export default async function CommunityPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return <CommunityClient />
}

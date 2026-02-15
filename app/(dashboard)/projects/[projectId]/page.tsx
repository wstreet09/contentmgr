import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ProjectDetailClient } from "./client"

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: { id: true, name: true, description: true, teamId: true },
  })

  if (!project) notFound()

  // Verify access
  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: project.teamId },
  })

  if (!membership) notFound()

  return (
    <ProjectDetailClient
      project={{ id: project.id, name: project.name }}
    />
  )
}

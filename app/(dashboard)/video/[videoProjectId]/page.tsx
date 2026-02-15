import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { VideoPageClient } from "@/components/video/video-page-client"
import { VideoDriveSettings } from "@/components/video/video-drive-settings"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default async function VideoProjectPage({
  params,
  searchParams,
}: {
  params: { videoProjectId: string }
  searchParams: { tab?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const project = await prisma.videoProject.findUnique({
    where: { id: params.videoProjectId },
    select: {
      id: true,
      name: true,
      teamId: true,
      googleDriveFolderId: true,
      googleDriveTokens: true,
      sheetId: true,
      sheetUrl: true,
      youtubeChannelUrl: true,
    },
  })

  if (!project) notFound()

  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: project.teamId },
  })

  if (!membership) notFound()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/video" className="hover:text-foreground">
          Video Content
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground text-sm">
          Manage video topics, hooks, descriptions, and mini-blogs.
        </p>
      </div>

      <Tabs defaultValue={searchParams.tab || "topics"} className="w-full">
        <TabsList>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="topics">
          <VideoPageClient videoProjectId={params.videoProjectId} hasSheet={!!project.sheetId} />
        </TabsContent>
        <TabsContent value="settings">
          <VideoDriveSettings
            videoProjectId={params.videoProjectId}
            hasTokens={!!project.googleDriveTokens}
            folderId={project.googleDriveFolderId}
            sheetId={project.sheetId}
            sheetUrl={project.sheetUrl}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

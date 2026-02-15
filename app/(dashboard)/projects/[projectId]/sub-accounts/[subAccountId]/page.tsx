import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ContentPageClient } from "@/components/content/content-page-client"
import { ExamplesTab } from "@/components/content/examples-tab"
import { PromptLibraryTab } from "@/components/content/prompt-library-tab"
import { DriveSettings } from "@/components/sub-accounts/drive-settings"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default async function SubAccountPage({
  params,
  searchParams,
}: {
  params: { projectId: string; subAccountId: string }
  searchParams: { tab?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const subAccount = await prisma.subAccount.findUnique({
    where: { id: params.subAccountId },
    include: {
      project: { select: { id: true, name: true, teamId: true } },
    },
  })

  if (!subAccount || subAccount.projectId !== params.projectId) notFound()

  const membership = await prisma.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: subAccount.project.teamId },
  })

  if (!membership) notFound()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/article" className="hover:text-foreground">
          Article Content
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/projects/${subAccount.project.id}`}
          className="hover:text-foreground"
        >
          {subAccount.project.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{subAccount.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{subAccount.name}</h1>
        <p className="text-muted-foreground text-sm">
          Manage content and examples for this location.
        </p>
      </div>

      <Tabs defaultValue={searchParams.tab || "content"} className="w-full">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <ContentPageClient subAccountId={params.subAccountId} />
        </TabsContent>
        <TabsContent value="examples">
          <ExamplesTab subAccountId={params.subAccountId} />
        </TabsContent>
        <TabsContent value="prompts">
          <PromptLibraryTab subAccountId={params.subAccountId} />
        </TabsContent>
        <TabsContent value="settings">
          <DriveSettings
            subAccountId={params.subAccountId}
            hasTokens={!!subAccount.googleDriveTokens}
            folderId={subAccount.googleDriveFolderId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

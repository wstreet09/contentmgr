"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, Video } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VideoProjectForm } from "@/components/video/video-project-form"
import { useToast } from "@/hooks/use-toast"

interface VideoProjectCardProps {
  project: {
    id: string
    name: string
    youtubeChannelUrl: string | null
    googleDriveFolderId: string | null
    sheetId: string | null
    _count: { topics: number }
  }
  onUpdate: () => void
}

export function VideoProjectCard({ project, onUpdate }: VideoProjectCardProps) {
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/video/projects/${project.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Video project deleted" })
      setDeleteOpen(false)
      onUpdate()
    } catch {
      toast({ title: "Failed to delete project", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Link
              href={`/video/${project.id}`}
              className="flex-1 hover:underline"
            >
              <CardTitle className="text-lg">{project.name}</CardTitle>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <VideoProjectForm
                  project={project}
                  onSuccess={onUpdate}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Video className="h-4 w-4" />
            <span>
              {project._count.topics}{" "}
              {project._count.topics === 1 ? "topic" : "topics"}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {project.googleDriveFolderId ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Drive connected
              </Badge>
            ) : (
              <Link href={`/video/${project.id}?tab=settings`}>
                <Badge variant="outline" className="text-muted-foreground hover:text-foreground hover:border-foreground cursor-pointer">
                  Drive not connected
                </Badge>
              </Link>
            )}
            {project.sheetId && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Sheet created
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete video project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;?
              This will also delete all video topics. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

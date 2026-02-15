"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

interface VideoProjectFormProps {
  project?: { id: string; name: string; youtubeChannelUrl: string | null }
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function VideoProjectForm({ project, onSuccess, trigger }: VideoProjectFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const isEdit = !!project

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const youtubeChannelUrl = formData.get("youtubeChannelUrl") as string

    try {
      const url = isEdit
        ? `/api/video/projects/${project.id}`
        : "/api/video/projects"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, youtubeChannelUrl }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save project")
      }

      toast({ title: isEdit ? "Project updated" : "Project created" })
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to save project",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Video Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Video Project" : "Create Video Project"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Acme Corp YouTube"
              defaultValue={project?.name || ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeChannelUrl">YouTube Channel URL (optional)</Label>
            <Input
              id="youtubeChannelUrl"
              name="youtubeChannelUrl"
              type="url"
              placeholder="https://www.youtube.com/@channel"
              defaultValue={project?.youtubeChannelUrl || ""}
            />
            <p className="text-xs text-muted-foreground">
              Used to scan existing videos and avoid duplicate topics.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

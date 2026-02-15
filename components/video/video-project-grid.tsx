"use client"

import { useEffect, useState, useCallback } from "react"
import { VideoProjectCard } from "@/components/video/video-project-card"
import { VideoProjectForm } from "@/components/video/video-project-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Video } from "lucide-react"

interface VideoProject {
  id: string
  name: string
  youtubeChannelUrl: string | null
  googleDriveFolderId: string | null
  sheetId: string | null
  _count: { topics: number }
}

export function VideoProjectGrid() {
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/video/projects")
      const data = await res.json()
      setProjects(data.data || [])
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Video className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No video projects yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first video project to get started.
        </p>
        <div className="mt-4">
          <VideoProjectForm onSuccess={fetchProjects} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <VideoProjectCard
          key={project.id}
          project={project}
          onUpdate={fetchProjects}
        />
      ))}
    </div>
  )
}

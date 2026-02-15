"use client"

import { useEffect, useState, useCallback } from "react"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectForm } from "@/components/projects/project-form"
import { Skeleton } from "@/components/ui/skeleton"
import { FolderOpen } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: { subAccounts: number }
}

export function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects")
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
        <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first project to get started.
        </p>
        <div className="mt-4">
          <ProjectForm onSuccess={fetchProjects} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onUpdate={fetchProjects}
        />
      ))}
    </div>
  )
}

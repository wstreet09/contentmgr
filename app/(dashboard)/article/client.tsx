"use client"

import { ProjectGrid } from "@/components/projects/project-grid"
import { ProjectForm } from "@/components/projects/project-form"
import { useState } from "react"

export function DashboardClient() {
  const [key, setKey] = useState(0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Article Content</h1>
          <p className="text-muted-foreground">Manage your projects</p>
        </div>
        <ProjectForm onSuccess={() => setKey((k) => k + 1)} />
      </div>
      <ProjectGrid key={key} />
    </div>
  )
}

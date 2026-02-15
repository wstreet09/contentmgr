"use client"

import { VideoProjectGrid } from "@/components/video/video-project-grid"
import { VideoProjectForm } from "@/components/video/video-project-form"
import { useState } from "react"

export function VideoDashboardClient() {
  const [key, setKey] = useState(0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Content</h1>
          <p className="text-muted-foreground">
            Manage your video content projects
          </p>
        </div>
        <VideoProjectForm onSuccess={() => setKey((k) => k + 1)} />
      </div>
      <VideoProjectGrid key={key} />
    </div>
  )
}

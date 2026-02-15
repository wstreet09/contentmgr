"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useVideoStore, VideoTopicRow } from "@/lib/store/video-store"
import { VideoTable } from "./video-table"
import { VideoToolbar } from "./video-toolbar"
import { VideoTopicSuggestDialog } from "./video-topic-suggest-dialog"
import { VideoGenerateDialog } from "./video-generate-dialog"
import { VideoSyncDialog } from "./video-sync-dialog"
import { useToast } from "@/hooks/use-toast"

interface VideoPageClientProps {
  videoProjectId: string
  hasSheet: boolean
}

export function VideoPageClient({ videoProjectId, hasSheet }: VideoPageClientProps) {
  const { rows, isDirty, setRows, markClean } = useVideoStore()
  const { toast } = useToast()
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [hooksOpen, setHooksOpen] = useState(false)
  const [descriptionsOpen, setDescriptionsOpen] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)

  // Load topics
  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch(`/api/video/topics?videoProjectId=${videoProjectId}`)
      if (!res.ok) throw new Error("Failed to load")
      const { data } = await res.json()
      const mapped: VideoTopicRow[] = data.map((item: VideoTopicRow & { id: string }) => ({
        id: item.id,
        title: item.title || "",
        hookStatus: item.hookStatus || "PENDING",
        descriptionStatus: item.descriptionStatus || "PENDING",
        miniBlogStatus: item.miniBlogStatus || "PENDING",
        videoLink: item.videoLink || "",
      }))
      setRows(mapped)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load video topics.",
        variant: "destructive",
      })
    }
  }, [videoProjectId, setRows, toast])

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  // Auto-save with debounce
  const save = useCallback(async () => {
    const currentRows = useVideoStore.getState().rows
    try {
      const res = await fetch("/api/video/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoProjectId, items: currentRows }),
      })
      if (!res.ok) throw new Error("Save failed")
      markClean()
    } catch {
      toast({
        title: "Auto-save failed",
        description: "Your changes may not be saved.",
        variant: "destructive",
      })
    }
  }, [videoProjectId, markClean, toast])

  useEffect(() => {
    if (!isDirty) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(save, 2000)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [isDirty, rows, save])

  return (
    <div className="space-y-4">
      <VideoTopicSuggestDialog
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        videoProjectId={videoProjectId}
      />
      <VideoGenerateDialog
        open={hooksOpen}
        onOpenChange={setHooksOpen}
        videoProjectId={videoProjectId}
        type="hooks"
        onComplete={loadTopics}
      />
      <VideoGenerateDialog
        open={descriptionsOpen}
        onOpenChange={setDescriptionsOpen}
        videoProjectId={videoProjectId}
        type="descriptions"
        onComplete={loadTopics}
      />
      <VideoSyncDialog
        open={syncOpen}
        onOpenChange={setSyncOpen}
        videoProjectId={videoProjectId}
        onComplete={loadTopics}
      />
      <VideoToolbar
        onSuggestTopics={() => setSuggestOpen(true)}
        onGenerateHooks={() => {
          if (!hasSheet) {
            toast({ title: "No tracking sheet", description: "Connect or create a tracking sheet in Settings first.", variant: "destructive" })
            return
          }
          setHooksOpen(true)
        }}
        onGenerateDescriptions={() => {
          if (!hasSheet) {
            toast({ title: "No tracking sheet", description: "Connect or create a tracking sheet in Settings first.", variant: "destructive" })
            return
          }
          setDescriptionsOpen(true)
        }}
        onSync={() => {
          if (!hasSheet) {
            toast({ title: "No tracking sheet", description: "Connect or create a tracking sheet in Settings first.", variant: "destructive" })
            return
          }
          setSyncOpen(true)
        }}
      />
      <VideoTable />
      {isDirty && (
        <p className="text-xs text-muted-foreground">Unsaved changes...</p>
      )}
    </div>
  )
}

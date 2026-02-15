"use client"

import { useVideoStore } from "@/lib/store/video-store"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Lightbulb, Sparkles, FileText, RefreshCw } from "lucide-react"

interface VideoToolbarProps {
  onSuggestTopics?: () => void
  onGenerateHooks?: () => void
  onGenerateDescriptions?: () => void
  onSync?: () => void
}

export function VideoToolbar({
  onSuggestTopics,
  onGenerateHooks,
  onGenerateDescriptions,
  onSync,
}: VideoToolbarProps) {
  const { selectedIds, addRow, deleteRows } = useVideoStore()

  const hasSelection = selectedIds.size > 0
  const selectedArray = Array.from(selectedIds)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-1 h-4 w-4" />
        Add Row
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => deleteRows(selectedArray)}
        disabled={!hasSelection}
      >
        <Trash2 className="mr-1 h-4 w-4" />
        Delete
      </Button>
      <Button variant="outline" size="sm" onClick={onSuggestTopics}>
        <Lightbulb className="mr-1 h-4 w-4" />
        Suggest Topics
      </Button>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onGenerateHooks}>
        <Sparkles className="mr-1 h-4 w-4" />
        Generate Hooks
      </Button>
      <Button variant="outline" size="sm" onClick={onGenerateDescriptions}>
        <FileText className="mr-1 h-4 w-4" />
        Generate Descriptions
      </Button>
      <Button variant="outline" size="sm" onClick={onSync}>
        <RefreshCw className="mr-1 h-4 w-4" />
        Sync Videos
      </Button>
    </div>
  )
}

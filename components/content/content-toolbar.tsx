"use client"

import { useContentStore } from "@/lib/store/content-store"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Copy, Upload, Download, Sparkles, Lightbulb, Maximize2, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContentToolbarProps {
  onImportCsv?: () => void
  onSuggestTopics?: () => void
  onGenerate?: () => void
  onFullScreen?: () => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
}

export function ContentToolbar({ onImportCsv, onSuggestTopics, onGenerate, onFullScreen, statusFilter, onStatusFilterChange }: ContentToolbarProps) {
  const { rows, selectedIds, addRow, deleteRows, duplicateRows } = useContentStore()

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
      <Button
        variant="outline"
        size="sm"
        onClick={() => duplicateRows(selectedArray)}
        disabled={!hasSelection}
      >
        <Copy className="mr-1 h-4 w-4" />
        Duplicate
      </Button>
      <Button variant="outline" size="sm" onClick={onImportCsv}>
        <Upload className="mr-1 h-4 w-4" />
        Import CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onSuggestTopics}>
        <Lightbulb className="mr-1 h-4 w-4" />
        Suggest Topics
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const headers = ["Title", "Content Type", "Service Area", "Target Audience", "Geolocation", "Target Keywords", "Include CTA", "Status"]
          const csvRows = rows.map((r) => [
            r.title,
            r.contentType,
            r.serviceArea,
            r.targetAudience,
            r.geolocation,
            r.targetKeywords,
            r.includeCta ? "true" : "false",
            r.status,
          ].map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","))
          const csv = [headers.join(","), ...csvRows].join("\n")
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "content-export.csv"
          a.click()
          URL.revokeObjectURL(url)
        }}
        disabled={rows.length === 0}
      >
        <Download className="mr-1 h-4 w-4" />
        Export
      </Button>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="h-8 w-[140px]">
          <Filter className="mr-1 h-3.5 w-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="GENERATING">Generating</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onFullScreen} title="Full Screen">
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button size="sm" onClick={onGenerate} disabled={!hasSelection}>
        <Sparkles className="mr-1 h-4 w-4" />
        Generate ({selectedIds.size})
      </Button>
    </div>
  )
}

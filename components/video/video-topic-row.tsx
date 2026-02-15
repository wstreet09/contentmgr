"use client"

import { useVideoStore, VideoTopicRow } from "@/lib/store/video-store"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

function statusLabel(status: string) {
  if (status === "IN_PROGRESS") return "In Progress"
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function VideoTopicRowComponent({ row }: { row: VideoTopicRow }) {
  const { selectedIds, toggleSelect, updateCell } = useVideoStore()
  const isSelected = selectedIds.has(row.id)

  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleSelect(row.id)}
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.title}
          onChange={(e) => updateCell(row.id, "title", e.target.value)}
          placeholder="Enter topic..."
          className="h-8 border-0 bg-transparent px-1 focus-visible:ring-1"
        />
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className={STATUS_COLORS[row.hookStatus] || ""}>
          {statusLabel(row.hookStatus)}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className={STATUS_COLORS[row.descriptionStatus] || ""}>
          {statusLabel(row.descriptionStatus)}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className={STATUS_COLORS[row.miniBlogStatus] || ""}>
          {statusLabel(row.miniBlogStatus)}
        </Badge>
      </TableCell>
      <TableCell>
        {row.videoLink ? (
          <a
            href={row.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline truncate block max-w-[200px]"
          >
            {row.videoLink}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  )
}

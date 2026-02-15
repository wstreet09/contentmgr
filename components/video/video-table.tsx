"use client"

import { useVideoStore } from "@/lib/store/video-store"
import { VideoTopicRowComponent } from "./video-topic-row"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function VideoTable() {
  const { rows, selectedIds, selectAll, clearSelection } = useVideoStore()

  const allSelected = rows.length > 0 && selectedIds.size === rows.length

  function handleSelectAll() {
    if (allSelected) {
      clearSelection()
    } else {
      selectAll()
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">
          No video topics yet. Add a row or suggest topics to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="min-w-[300px]">Video Topic</TableHead>
            <TableHead className="w-[120px] text-center">Hooks</TableHead>
            <TableHead className="w-[120px] text-center">Descriptions</TableHead>
            <TableHead className="w-[120px] text-center">Mini Blogs</TableHead>
            <TableHead className="w-[200px]">Video Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <VideoTopicRowComponent key={row.id} row={row} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

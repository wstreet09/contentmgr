"use client"

import { useState } from "react"
import { useContentStore, ContentRow } from "@/lib/store/content-store"
import { ContentRowComponent } from "./content-row"
import { ContentViewerDialog } from "./content-viewer-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ContentTableProps {
  statusFilter?: string
}

export function ContentTable({ statusFilter = "ALL" }: ContentTableProps) {
  const { rows, selectedIds, selectAll, clearSelection } = useContentStore()
  const [viewingRow, setViewingRow] = useState<ContentRow | null>(null)

  const filteredRows = statusFilter === "ALL" ? rows : rows.filter((r) => r.status === statusFilter)
  const allSelected = filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.id))

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
          No content items yet. Add a row or import a CSV to get started.
        </p>
      </div>
    )
  }

  if (filteredRows.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">
          No items match the current filter.
        </p>
      </div>
    )
  }

  return (
    <>
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
              <TableHead className="min-w-[200px]">Title</TableHead>
              <TableHead className="w-[160px]">Article Type</TableHead>
              <TableHead className="min-w-[140px]">Service Area</TableHead>
              <TableHead className="min-w-[140px]">Audience</TableHead>
              <TableHead className="min-w-[140px]">Location</TableHead>
              <TableHead className="min-w-[160px]">Keywords</TableHead>
              <TableHead className="w-[60px] text-center">CTA</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <ContentRowComponent
                key={row.id}
                row={row}
                onView={row.generatedContent ? () => setViewingRow(row) : undefined}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      {viewingRow && (
        <ContentViewerDialog
          open={!!viewingRow}
          onOpenChange={(open) => { if (!open) setViewingRow(null) }}
          title={viewingRow.title}
          content={viewingRow.generatedContent || ""}
        />
      )}
    </>
  )
}

"use client"

import { useContentStore, ContentRow } from "@/lib/store/content-store"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { Eye } from "lucide-react"
import { CSSProperties } from "react"

const CONTENT_TYPES = [
  { value: "BLOG_POST", label: "Blog Post" },
  { value: "SERVICE_PAGE", label: "Service Page" },
  { value: "LOCATION_PAGE", label: "Location Page" },
  { value: "LANDING_PAGE", label: "Landing Page" },
  { value: "ABOUT_PAGE", label: "About Page" },
  { value: "FAQ_PAGE", label: "FAQ Page" },
  { value: "HOW_TO_GUIDE", label: "How-To Guide" },
]

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  QUEUED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  GENERATING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function ContentRowComponent({ row, style, onView }: { row: ContentRow; style?: CSSProperties; onView?: () => void }) {
  const { selectedIds, toggleSelect, updateCell } = useContentStore()
  const isSelected = selectedIds.has(row.id)

  return (
    <TableRow data-state={isSelected ? "selected" : undefined} style={style}>
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
          placeholder="Enter title..."
          className="h-8 border-0 bg-transparent px-1 focus-visible:ring-1"
        />
      </TableCell>
      <TableCell>
        <Select
          value={row.contentType}
          onValueChange={(v) => updateCell(row.id, "contentType", v)}
        >
          <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((ct) => (
              <SelectItem key={ct.value} value={ct.value}>
                {ct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={row.serviceArea}
          onChange={(e) => updateCell(row.id, "serviceArea", e.target.value)}
          placeholder="e.g. Plumbing"
          className="h-8 border-0 bg-transparent px-1 focus-visible:ring-1"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.targetAudience}
          onChange={(e) => updateCell(row.id, "targetAudience", e.target.value)}
          placeholder="e.g. Homeowners"
          className="h-8 border-0 bg-transparent px-1 focus-visible:ring-1"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.geolocation}
          onChange={(e) => updateCell(row.id, "geolocation", e.target.value)}
          placeholder="e.g. Austin, TX"
          className="h-8 border-0 bg-transparent px-1 focus-visible:ring-1"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.targetKeywords}
          onChange={(e) => updateCell(row.id, "targetKeywords", e.target.value)}
          placeholder="keyword1, keyword2"
          className="h-8 border-0 bg-transparent px-1 focus-visible:ring-1"
        />
      </TableCell>
      <TableCell className="text-center">
        <Checkbox
          checked={row.includeCta}
          onCheckedChange={(v) => updateCell(row.id, "includeCta", !!v)}
        />
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={STATUS_COLORS[row.status] || ""}>
          {statusLabel(row.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {onView && (
          <Button variant="ghost" size="sm" onClick={onView} className="h-7 w-7 p-0">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

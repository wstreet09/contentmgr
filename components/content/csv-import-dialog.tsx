"use client"

import { useState, useRef } from "react"
import Papa from "papaparse"
import { useContentStore, ContentRow } from "@/lib/store/content-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const FIELDS: { key: keyof ContentRow; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "contentType", label: "Content Type" },
  { key: "serviceArea", label: "Service Area" },
  { key: "targetAudience", label: "Target Audience" },
  { key: "geolocation", label: "Geolocation" },
  { key: "targetKeywords", label: "Target Keywords" },
  { key: "includeCta", label: "Include CTA" },
]

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const { addRows } = useContentStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      complete(results) {
        const data = results.data as string[][]
        if (data.length < 2) return
        setCsvHeaders(data[0])
        setCsvData(data.slice(1).filter((row) => row.some((cell) => cell.trim())))
        // Auto-map by matching header names
        const autoMap: Record<string, string> = {}
        data[0].forEach((header) => {
          const normalized = header.toLowerCase().replace(/[^a-z]/g, "")
          const match = FIELDS.find(
            (f) => f.key.toLowerCase() === normalized || f.label.toLowerCase().replace(/[^a-z]/g, "") === normalized
          )
          if (match) autoMap[header] = match.key
        })
        setMapping(autoMap)
      },
    })
  }

  function handleImport() {
    const rows: ContentRow[] = csvData.map((row) => {
      const item: ContentRow = {
        id: crypto.randomUUID(),
        title: "",
        contentType: "BLOG_POST",
        serviceArea: "",
        targetAudience: "",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
        status: "DRAFT",
      }

      csvHeaders.forEach((header, i) => {
        const fieldKey = mapping[header]
        if (!fieldKey || !row[i]) return
        if (fieldKey === "includeCta") {
          item.includeCta = ["true", "yes", "1"].includes(row[i].toLowerCase().trim())
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(item as any)[fieldKey] = row[i].trim()
        }
      })

      return item
    })

    addRows(rows)
    onOpenChange(false)
    // Reset state
    setCsvHeaders([])
    setCsvData([])
    setMapping({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
        </DialogHeader>

        {csvHeaders.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with content items. The first row should contain headers.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Map CSV columns to content fields. {csvData.length} rows found.
            </p>

            <div className="grid gap-3">
              {csvHeaders.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <Label className="w-32 truncate text-sm font-medium">
                    {header}
                  </Label>
                  <Select
                    value={mapping[header] || "skip"}
                    onValueChange={(v) =>
                      setMapping((m) => ({ ...m, [header]: v === "skip" ? "" : v }))
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Skip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip</SelectItem>
                      {FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="rounded-md border max-h-48 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvHeaders.map((h) => (
                      <TableHead key={h} className="text-xs">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 3).map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-xs">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCsvHeaders([])
                  setCsvData([])
                  setMapping({})
                }}
              >
                Reset
              </Button>
              <Button onClick={handleImport}>
                Import {csvData.length} Rows
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

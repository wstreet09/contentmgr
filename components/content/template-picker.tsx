"use client"

import { useContentStore, ContentRow } from "@/lib/store/content-store"
import { CONTENT_TEMPLATES } from "@/lib/templates"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TemplatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplatePicker({ open, onOpenChange }: TemplatePickerProps) {
  const { addRows } = useContentStore()

  function handleSelect(templateIndex: number) {
    const template = CONTENT_TEMPLATES[templateIndex]
    const rows: ContentRow[] = template.rows.map((r) => ({
      ...r,
      id: crypto.randomUUID(),
      status: "DRAFT",
    }))
    addRows(rows)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Content Templates</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-auto">
          {CONTENT_TEMPLATES.map((template, i) => (
            <Card
              key={i}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSelect(i)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <Badge variant="secondary">{template.rows.length} items</Badge>
                </div>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Templates add rows with placeholder titles. Edit them to match your business.
        </p>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContentViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  content: string
}

export function ContentViewerDialog({
  open,
  onOpenChange,
  title,
  content,
}: ContentViewerDialogProps) {
  const { toast } = useToast()

  async function handleCopy() {
    try {
      const blob = new Blob([content], { type: "text/html" })
      const textBlob = new Blob([new DOMParser().parseFromString(content, "text/html").body.textContent || ""], { type: "text/plain" })
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        }),
      ])
    } catch {
      // Fallback for browsers that don't support clipboard.write
      const tmp = document.createElement("div")
      tmp.innerHTML = content
      navigator.clipboard.writeText(tmp.textContent || "")
    }
    toast({ title: "Copied", description: "Content copied to clipboard." })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-1 h-4 w-4" />
            Copy
          </Button>
        </div>
        <div
          className="flex-1 overflow-auto rounded-md border p-4 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </DialogContent>
    </Dialog>
  )
}

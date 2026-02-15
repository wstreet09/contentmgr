"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SyncResult {
  title: string
  success: boolean
  error?: string
}

interface VideoSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoProjectId: string
  onComplete: () => void
}

export function VideoSyncDialog({
  open,
  onOpenChange,
  videoProjectId,
  onComplete,
}: VideoSyncDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SyncResult[] | null>(null)
  const [summary, setSummary] = useState("")

  async function handleSync() {
    setLoading(true)
    setResults(null)
    setSummary("")

    try {
      const res = await fetch("/api/video/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoProjectId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Sync failed")
      }

      const { data } = await res.json()

      if (data.message) {
        setSummary(data.message)
      } else {
        setSummary(
          `Processed ${data.processed} video${data.processed !== 1 ? "s" : ""}: ${data.succeeded} succeeded, ${data.failed} failed.`
        )
        setResults(data.results || [])
      }

      onComplete()
    } catch (err) {
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleClose(isOpen: boolean) {
    if (!loading) {
      onOpenChange(isOpen)
      if (!isOpen) {
        setResults(null)
        setSummary("")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Videos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Checks the tracking sheet for new video links, transcribes each video
            using Gemini, and generates mini-blog posts saved as Google Docs.
          </p>

          <p className="text-xs text-muted-foreground">
            Requires a Gemini API key configured in Settings. Video links should be
            Google Drive URLs in Sheet Column C.
          </p>

          {!results && !summary && (
            <Button
              onClick={handleSync}
              disabled={loading}
              className="w-full"
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Syncing... (this may take a few minutes)" : "Start Sync"}
            </Button>
          )}

          {summary && (
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">{summary}</p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm"
                >
                  {r.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">{r.title}</span>
                    {r.error && (
                      <p className="text-xs text-muted-foreground">{r.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(results || summary) && (
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="w-full"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

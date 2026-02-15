"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

interface BatchProgressProps {
  batchId: string
  onComplete?: () => void
}

interface ProgressData {
  status: string
  totalItems: number
  completedItems: number
  failedItems: number
}

export function BatchProgress({ batchId, onComplete }: BatchProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(`/api/content/batch/${batchId}/progress`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as ProgressData
      setProgress(data)

      if (["COMPLETED", "FAILED", "CANCELLED"].includes(data.status)) {
        es.close()
        onComplete?.()
      }
    }

    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [batchId, onComplete])

  if (!progress) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-3 px-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Connecting...</span>
        </CardContent>
      </Card>
    )
  }

  const processed = progress.completedItems + progress.failedItems
  const percent = progress.totalItems > 0
    ? Math.round((processed / progress.totalItems) * 100)
    : 0
  const isActive = ["PENDING", "PROCESSING"].includes(progress.status)
  const isDone = progress.status === "COMPLETED"
  const hasFailed = progress.failedItems > 0

  return (
    <Card>
      <CardContent className="py-3 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isActive && <Loader2 className="h-4 w-4 animate-spin" />}
            {isDone && !hasFailed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {isDone && hasFailed && <XCircle className="h-4 w-4 text-yellow-600" />}
            {progress.status === "FAILED" && <XCircle className="h-4 w-4 text-red-600" />}
            <span className="text-sm font-medium">
              {isActive ? "Generating content..." : "Generation complete"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {processed} / {progress.totalItems}
            </span>
            {hasFailed && (
              <Badge variant="destructive" className="text-xs">
                {progress.failedItems} failed
              </Badge>
            )}
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

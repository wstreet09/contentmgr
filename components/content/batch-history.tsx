"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRight, ExternalLink, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BatchItem {
  id: string
  title: string
  status: string
  errorMessage: string | null
  googleDocUrl: string | null
}

interface Batch {
  id: string
  status: string
  totalItems: number
  completedItems: number
  failedItems: number
  createdAt: string
  completedAt: string | null
  items: BatchItem[]
}

interface BatchHistoryProps {
  subAccountId: string
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PROCESSING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-muted text-muted-foreground",
}

export function BatchHistory({ subAccountId }: BatchHistoryProps) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetch(`/api/content/batches?subAccountId=${subAccountId}`)
      .then((r) => r.json())
      .then(({ data }) => setBatches(data || []))
      .catch(() => {})
  }, [subAccountId])

  async function handleRetry(batchId: string) {
    try {
      const res = await fetch("/api/content/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, provider: "openai" }),
      })
      if (!res.ok) throw new Error("Retry failed")
      toast({ title: "Retrying failed items..." })
    } catch {
      toast({ title: "Retry failed", variant: "destructive" })
    }
  }

  if (batches.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Batch History</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <Collapsible key={batch.id} asChild open={expandedId === batch.id}>
                <>
                  <CollapsibleTrigger asChild>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === batch.id ? null : batch.id)
                      }
                    >
                      <TableCell>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedId === batch.id ? "rotate-90" : ""
                          }`}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_COLORS[batch.status] || ""}>
                          {batch.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {batch.completedItems}/{batch.totalItems}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {batch.failedItems}
                      </TableCell>
                      <TableCell>
                        {batch.failedItems > 0 && batch.status !== "PROCESSING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRetry(batch.id)
                            }}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <div className="px-8 py-2 space-y-1">
                          {batch.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs py-1"
                            >
                              <span className="truncate max-w-[300px]">
                                {item.title}
                              </span>
                              <div className="flex items-center gap-2">
                                {item.errorMessage && (
                                  <span className="text-red-500 truncate max-w-[200px]">
                                    {item.errorMessage}
                                  </span>
                                )}
                                {item.googleDocUrl && (
                                  <a
                                    href={item.googleDocUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${STATUS_COLORS[item.status] || ""}`}
                                >
                                  {item.status.toLowerCase()}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

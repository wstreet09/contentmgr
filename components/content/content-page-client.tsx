"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useContentStore, ContentRow } from "@/lib/store/content-store"
import { ContentTable } from "./content-table"
import { ContentToolbar } from "./content-toolbar"
import { CsvImportDialog } from "./csv-import-dialog"
import { BatchProgress } from "./batch-progress"
import { GenerateDialog } from "./generate-dialog"
import { TopicSuggestDialog } from "./topic-suggest-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface ContentPageClientProps {
  subAccountId: string
}

export function ContentPageClient({ subAccountId }: ContentPageClientProps) {
  const { rows, isDirty, setRows, markClean } = useContentStore()
  const { toast } = useToast()
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [suggestTopicsOpen, setSuggestTopicsOpen] = useState(false)
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Load content items on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/content/items?subAccountId=${subAccountId}`)
        if (!res.ok) throw new Error("Failed to load")
        const { data } = await res.json()
        const mapped: ContentRow[] = data.map((item: ContentRow & { id: string; generatedContent?: string }) => ({
          id: item.id,
          title: item.title || "",
          contentType: item.contentType || "BLOG_POST",
          serviceArea: item.serviceArea || "",
          targetAudience: item.targetAudience || "",
          geolocation: item.geolocation || "",
          targetKeywords: item.targetKeywords || "",
          includeCta: item.includeCta ?? true,
          status: item.status || "DRAFT",
          generatedContent: item.generatedContent || undefined,
        }))
        setRows(mapped)
      } catch {
        toast({
          title: "Error",
          description: "Failed to load content items.",
          variant: "destructive",
        })
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subAccountId])

  // Auto-save drafts with debounce
  const save = useCallback(async () => {
    const currentRows = useContentStore.getState().rows
    try {
      const res = await fetch("/api/content/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subAccountId, items: currentRows }),
      })
      if (!res.ok) throw new Error("Save failed")
      markClean()
    } catch {
      toast({
        title: "Auto-save failed",
        description: "Your changes may not be saved.",
        variant: "destructive",
      })
    }
  }, [subAccountId, markClean, toast])

  useEffect(() => {
    if (!isDirty) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(save, 2000)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [isDirty, rows, save])

  const tableContent = (
    <div className="space-y-4">
      <ContentToolbar
        onImportCsv={() => setCsvOpen(true)}
        onSuggestTopics={() => setSuggestTopicsOpen(true)}
        onGenerate={() => setGenerateOpen(true)}
        onFullScreen={() => setIsFullScreen(!isFullScreen)}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      {activeBatchId && (
        <BatchProgress
          batchId={activeBatchId}
          onComplete={() => {
            setActiveBatchId(null)
            fetch(`/api/content/items?subAccountId=${subAccountId}`)
              .then((r) => r.json())
              .then(({ data }) => {
                const mapped: ContentRow[] = data.map((item: ContentRow & { generatedContent?: string }) => ({
                  id: item.id,
                  title: item.title || "",
                  contentType: item.contentType || "BLOG_POST",
                  serviceArea: item.serviceArea || "",
                  targetAudience: item.targetAudience || "",
                  geolocation: item.geolocation || "",
                  targetKeywords: item.targetKeywords || "",
                  includeCta: item.includeCta ?? true,
                  status: item.status || "DRAFT",
                  generatedContent: item.generatedContent || undefined,
                }))
                setRows(mapped)
              })
          }}
        />
      )}
      <ContentTable statusFilter={statusFilter} />
      {isDirty && (
        <p className="text-xs text-muted-foreground">Unsaved changes...</p>
      )}
    </div>
  )

  return (
    <>
      {isFullScreen ? (
        <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
          <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col overflow-auto p-6">
            {tableContent}
          </DialogContent>
        </Dialog>
      ) : (
        tableContent
      )}
      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} />
      <GenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        subAccountId={subAccountId}
        onBatchStarted={(batchId) => setActiveBatchId(batchId)}
      />
      <TopicSuggestDialog
        open={suggestTopicsOpen}
        onOpenChange={setSuggestTopicsOpen}
        subAccountId={subAccountId}
      />
    </>
  )
}

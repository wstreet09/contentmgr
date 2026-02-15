"use client"

import { useState } from "react"
import { useContentStore, ContentRow } from "@/lib/store/content-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Lightbulb } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TopicSuggestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subAccountId: string
}

export function TopicSuggestDialog({
  open,
  onOpenChange,
  subAccountId,
}: TopicSuggestDialogProps) {
  const { addRows } = useContentStore()
  const { toast } = useToast()
  const [provider, setProvider] = useState("openai")
  const [count, setCount] = useState("5")
  const [sitemapUrl, setSitemapUrl] = useState("")
  const [topicDirection, setTopicDirection] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSuggest() {
    setLoading(true)
    try {
      const res = await fetch("/api/content/suggest-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subAccountId,
          count: parseInt(count) || 5,
          provider,
          sitemapUrl: sitemapUrl || undefined,
          topicDirection: topicDirection || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to generate topics")
      }

      const { data: topics } = await res.json()

      const newRows: ContentRow[] = topics.map(
        (topic: { title: string; targetKeywords?: string; targetAudience?: string }) => ({
          id: crypto.randomUUID(),
          title: topic.title,
          contentType: "BLOG_POST",
          serviceArea: "",
          targetAudience: topic.targetAudience || "",
          geolocation: "",
          targetKeywords: topic.targetKeywords || "",
          includeCta: true,
          status: "DRAFT",
        })
      )

      addRows(newRows)
      onOpenChange(false)
      toast({
        title: "Topics generated",
        description: `Added ${newRows.length} blog topic${newRows.length !== 1 ? "s" : ""} to the table.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate topics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Suggest Blog Topics</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI will suggest unique blog topics based on your business
            and avoid duplicating existing content.
          </p>

          <div className="space-y-2">
            <Label>Number of Topics</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Topic Direction (optional)</Label>
            <Input
              placeholder="e.g. car accidents, truck accidents, slip and fall"
              value={topicDirection}
              onChange={(e) => setTopicDirection(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Guide the AI toward specific subjects or service areas.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Sitemap URL (optional)</Label>
            <Input
              type="url"
              placeholder="https://example.com/sitemap.xml"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Provide your sitemap URL to avoid duplicating existing blog topics.
            </p>
          </div>

          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                <SelectItem value="gemini">Google (Gemini 1.5 Pro)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Make sure you have configured your API key in Settings.
          </p>

          <Button
            onClick={handleSuggest}
            disabled={loading}
            className="w-full"
          >
            <Lightbulb className="mr-1 h-4 w-4" />
            {loading ? "Generating..." : `Suggest ${count} Topics`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

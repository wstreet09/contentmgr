"use client"

import { useState } from "react"
import { useVideoStore, VideoTopicRow } from "@/lib/store/video-store"
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

interface VideoTopicSuggestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoProjectId: string
}

export function VideoTopicSuggestDialog({
  open,
  onOpenChange,
  videoProjectId,
}: VideoTopicSuggestDialogProps) {
  const { addRows } = useVideoStore()
  const { toast } = useToast()
  const [provider, setProvider] = useState("openai")
  const [count, setCount] = useState("5")
  const [topicDirection, setTopicDirection] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSuggest() {
    setLoading(true)
    try {
      const res = await fetch("/api/video/topics/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoProjectId,
          count: parseInt(count) || 5,
          provider,
          topicDirection: topicDirection || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to generate topics")
      }

      const { data: topics } = await res.json()

      const newRows: VideoTopicRow[] = topics.map(
        (topic: { title: string }) => ({
          id: crypto.randomUUID(),
          title: topic.title,
          hookStatus: "PENDING",
          descriptionStatus: "PENDING",
          miniBlogStatus: "PENDING",
          videoLink: "",
        })
      )

      addRows(newRows)
      onOpenChange(false)
      toast({
        title: "Topics generated",
        description: `Added ${newRows.length} video topic${newRows.length !== 1 ? "s" : ""} to the table.`,
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
          <DialogTitle>Suggest Video Topics</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI will suggest unique video topics for your project
            and avoid duplicating existing YouTube videos or table topics.
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
              placeholder="e.g. tutorials, behind the scenes, product reviews"
              value={topicDirection}
              onChange={(e) => setTopicDirection(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Guide the AI toward specific subjects or themes.
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

"use client"

import { useState } from "react"
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
import { Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const MODELS_BY_PROVIDER: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-5", label: "GPT-5" },
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  ],
  gemini: [
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  ],
}

type GenerateType = "hooks" | "descriptions"

interface VideoGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoProjectId: string
  type: GenerateType
  onComplete: () => void
}

export function VideoGenerateDialog({
  open,
  onOpenChange,
  videoProjectId,
  type,
  onComplete,
}: VideoGenerateDialogProps) {
  const { toast } = useToast()
  const [provider, setProvider] = useState("openai")
  const [model, setModel] = useState("gpt-4.1")
  const [loading, setLoading] = useState(false)

  const title = type === "hooks" ? "Generate Hooks" : "Generate Descriptions"
  const description =
    type === "hooks"
      ? "Generate hooks and lead-ins for all video topics. A Google Doc will be created in your Drive folder."
      : "Generate YouTube descriptions for all video topics. A Google Doc will be created in your Drive folder."

  function handleProviderChange(value: string) {
    setProvider(value)
    setModel(MODELS_BY_PROVIDER[value][0].value)
  }

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/video/generate/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoProjectId, provider, model }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Failed to generate ${type}`)
      }

      const { data } = await res.json()
      onOpenChange(false)
      onComplete()

      const docMsg = data.docUrl
        ? ` Google Doc created.`
        : " (No Drive connected — content generated but not saved to Drive.)"

      toast({
        title: `${type === "hooks" ? "Hooks" : "Descriptions"} generated`,
        description: `Updated ${data.topicsUpdated} topics.${docMsg}`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to generate ${type}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const models = MODELS_BY_PROVIDER[provider] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Make sure you have configured your API key in Settings.
          </p>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            <Sparkles className="mr-1 h-4 w-4" />
            {loading ? "Generating..." : title}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

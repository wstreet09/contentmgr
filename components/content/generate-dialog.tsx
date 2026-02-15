"use client"

import { useState, useEffect } from "react"
import { useContentStore } from "@/lib/store/content-store"
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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

const TEMPLATES = [
  { value: "default", label: "Default (SEO-Optimized)" },
  { value: "conversational", label: "Conversational" },
  { value: "technical", label: "Technical / In-Depth" },
  { value: "listicle", label: "Listicle" },
  { value: "local-seo", label: "Local SEO" },
]

interface GenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subAccountId: string
  onBatchStarted: (batchId: string) => void
}

export function GenerateDialog({
  open,
  onOpenChange,
  subAccountId,
  onBatchStarted,
}: GenerateDialogProps) {
  const { selectedIds } = useContentStore()
  const { toast } = useToast()
  const [provider, setProvider] = useState("openai")
  const [model, setModel] = useState("gpt-4.1")
  const [wordCount, setWordCount] = useState("800")
  const [templatePrompt, setTemplatePrompt] = useState("default")
  const [loading, setLoading] = useState(false)
  const [examples, setExamples] = useState<{ id: string; name: string; content: string }[]>([])
  const [customPrompts, setCustomPrompts] = useState<{ id: string; name: string; prompt: string }[]>([])

  useEffect(() => {
    if (open) {
      fetch(`/api/content/examples?subAccountId=${subAccountId}`)
        .then((r) => r.json())
        .then(({ data }) => setExamples(data || []))
        .catch(() => setExamples([]))
      fetch(`/api/content/prompts?subAccountId=${subAccountId}`)
        .then((r) => r.json())
        .then(({ data }) => setCustomPrompts(data || []))
        .catch(() => setCustomPrompts([]))
    }
  }, [open, subAccountId])

  function handleProviderChange(value: string) {
    setProvider(value)
    setModel(MODELS_BY_PROVIDER[value][0].value)
  }

  async function handleGenerate() {
    setLoading(true)
    try {
      const isCustomExample = templatePrompt.startsWith("example:")
      const isCustomPrompt = templatePrompt.startsWith("prompt:")
      const exampleContent = isCustomExample
        ? examples.find((ex) => `example:${ex.id}` === templatePrompt)?.content
        : undefined
      const customPromptInstruction = isCustomPrompt
        ? customPrompts.find((p) => `prompt:${p.id}` === templatePrompt)?.prompt
        : undefined

      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subAccountId,
          itemIds: Array.from(selectedIds),
          provider,
          model,
          wordCount: parseInt(wordCount) || 800,
          templatePrompt: (isCustomExample || isCustomPrompt) ? undefined : templatePrompt,
          exampleContent,
          customPromptInstruction,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to start generation")
      }

      const { data } = await res.json()
      onBatchStarted(data.batchId)
      onOpenChange(false)
      toast({ title: "Generation started", description: `Processing ${selectedIds.size} items...` })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to start generation",
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
          <DialogTitle>Generate Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate content for {selectedIds.size} selected item{selectedIds.size !== 1 ? "s" : ""}.
          </p>

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

          <div className="space-y-2">
            <Label>Word Count</Label>
            <Input
              type="number"
              min={200}
              max={5000}
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Template / Example</Label>
            <Select value={templatePrompt} onValueChange={setTemplatePrompt}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Built-in Templates</SelectLabel>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
                {customPrompts.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Your Prompts</SelectLabel>
                    {customPrompts.map((p) => (
                      <SelectItem key={p.id} value={`prompt:${p.id}`}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {examples.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Your Examples</SelectLabel>
                    {examples.map((ex) => (
                      <SelectItem key={ex.id} value={`example:${ex.id}`}>
                        {ex.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Make sure you have configured your API key in Settings.
          </p>

          <Button
            onClick={handleGenerate}
            disabled={loading || selectedIds.size === 0}
            className="w-full"
          >
            <Sparkles className="mr-1 h-4 w-4" />
            {loading ? "Generating..." : `Generate ${selectedIds.size} Items`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

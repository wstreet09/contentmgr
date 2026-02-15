"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface ApiKeys {
  openai?: string
  anthropic?: string
  gemini?: string
}

function maskKey(key: string | undefined): string {
  if (!key) return ""
  if (key.length <= 8) return "****"
  return "****" + key.slice(-4)
}

export function ApiKeyForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [maskedKeys, setMaskedKeys] = useState<ApiKeys>({})
  const [keys, setKeys] = useState<ApiKeys>({})

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => res.json())
      .then((data) => setMaskedKeys(data.keys || {}))
      .catch(() => {})
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      })

      if (!res.ok) throw new Error("Failed to save API keys")

      const data = await res.json()
      setMaskedKeys(data.keys || {})
      setKeys({})
      toast({ title: "API keys saved" })
    } catch {
      toast({ title: "Failed to save API keys", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const providers = [
    { id: "openai" as const, label: "OpenAI", placeholder: "sk-..." },
    { id: "anthropic" as const, label: "Anthropic", placeholder: "sk-ant-..." },
    { id: "gemini" as const, label: "Google Gemini", placeholder: "AI..." },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM API Keys</CardTitle>
        <CardDescription>
          Your keys are encrypted with AES-256-GCM and never displayed in
          plaintext after saving.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="space-y-2">
              <Label htmlFor={provider.id}>{provider.label}</Label>
              <Input
                id={provider.id}
                placeholder={
                  maskedKeys[provider.id]
                    ? maskKey(maskedKeys[provider.id])
                    : provider.placeholder
                }
                value={keys[provider.id] || ""}
                onChange={(e) =>
                  setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                }
              />
              {maskedKeys[provider.id] && !keys[provider.id] && (
                <p className="text-xs text-muted-foreground">
                  Current key: {maskKey(maskedKeys[provider.id])}
                </p>
              )}
            </div>
          ))}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save API keys"}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}

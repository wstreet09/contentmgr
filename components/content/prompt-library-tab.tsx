"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CustomPrompt {
  id: string
  name: string
  prompt: string
}

interface PromptLibraryTabProps {
  subAccountId: string
}

export function PromptLibraryTab({ subAccountId }: PromptLibraryTabProps) {
  const { toast } = useToast()
  const [prompts, setPrompts] = useState<CustomPrompt[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")
  const [prompt, setPrompt] = useState("")

  useEffect(() => {
    fetchPrompts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subAccountId])

  async function fetchPrompts() {
    const res = await fetch(`/api/content/prompts?subAccountId=${subAccountId}`)
    if (res.ok) {
      const { data } = await res.json()
      setPrompts(data)
    }
  }

  async function handleSave() {
    if (!name.trim() || !prompt.trim()) {
      toast({ title: "Error", description: "Name and prompt are required.", variant: "destructive" })
      return
    }

    try {
      if (editingId) {
        const res = await fetch("/api/content/prompts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name, prompt }),
        })
        if (!res.ok) throw new Error("Failed to update")
        toast({ title: "Updated", description: "Prompt updated." })
      } else {
        const res = await fetch("/api/content/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subAccountId, name, prompt }),
        })
        if (!res.ok) throw new Error("Failed to create")
        toast({ title: "Created", description: "Prompt added." })
      }
      cancelEdit()
      fetchPrompts()
    } catch {
      toast({ title: "Error", description: "Failed to save prompt.", variant: "destructive" })
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/content/prompts?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Deleted", description: "Prompt removed." })
      fetchPrompts()
    } catch {
      toast({ title: "Error", description: "Failed to delete prompt.", variant: "destructive" })
    }
  }

  function startEdit(p: CustomPrompt) {
    setEditingId(p.id)
    setName(p.name)
    setPrompt(p.prompt)
    setIsAdding(false)
  }

  function startAdd() {
    setEditingId(null)
    setName("")
    setPrompt("")
    setIsAdding(true)
  }

  function cancelEdit() {
    setEditingId(null)
    setIsAdding(false)
    setName("")
    setPrompt("")
  }

  const showForm = isAdding || editingId !== null

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prompt Library</h3>
          <p className="text-sm text-muted-foreground">
            Create custom prompts for the AI to follow when generating content. Select them in the Generate dialog.
          </p>
        </div>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={startAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add Prompt
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Friendly Blog Tone"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt Instructions</Label>
              <Textarea
                placeholder="Write the instructions the AI should follow when generating content..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                This will replace the built-in template instruction in the content generation prompt.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="mr-1 h-4 w-4" />
                {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {prompts.length === 0 && !showForm && (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            No prompts yet. Add one to customize how the AI generates content.
          </p>
        </div>
      )}

      {prompts.map((p) => (
        <Card key={p.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{p.name}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
                  {p.prompt}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => startEdit(p)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

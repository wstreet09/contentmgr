"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContentExample {
  id: string
  name: string
  content: string
}

interface ExamplesTabProps {
  subAccountId: string
}

export function ExamplesTab({ subAccountId }: ExamplesTabProps) {
  const { toast } = useToast()
  const [examples, setExamples] = useState<ContentExample[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchExamples()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subAccountId])

  async function fetchExamples() {
    const res = await fetch(`/api/content/examples?subAccountId=${subAccountId}`)
    if (res.ok) {
      const { data } = await res.json()
      setExamples(data)
    }
  }

  async function handleSave() {
    const htmlContent = editorRef.current?.innerHTML || ""
    if (!name.trim() || !htmlContent.trim()) {
      toast({ title: "Error", description: "Name and content are required.", variant: "destructive" })
      return
    }

    try {
      if (editingId) {
        const res = await fetch("/api/content/examples", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name, content: htmlContent }),
        })
        if (!res.ok) throw new Error("Failed to update")
        toast({ title: "Updated", description: "Example updated." })
      } else {
        const res = await fetch("/api/content/examples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subAccountId, name, content: htmlContent }),
        })
        if (!res.ok) throw new Error("Failed to create")
        toast({ title: "Created", description: "Example added." })
      }
      cancelEdit()
      fetchExamples()
    } catch {
      toast({ title: "Error", description: "Failed to save example.", variant: "destructive" })
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/content/examples?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Deleted", description: "Example removed." })
      fetchExamples()
    } catch {
      toast({ title: "Error", description: "Failed to delete example.", variant: "destructive" })
    }
  }

  function startEdit(example: ContentExample) {
    setEditingId(example.id)
    setName(example.name)
    setIsAdding(false)
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = example.content
    }, 0)
  }

  function startAdd() {
    setEditingId(null)
    setName("")
    setIsAdding(true)
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = ""
    }, 0)
  }

  function cancelEdit() {
    setEditingId(null)
    setIsAdding(false)
    setName("")
  }

  const showForm = isAdding || editingId !== null

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Examples</h3>
          <p className="text-sm text-muted-foreground">
            Add example content for the AI to reference when generating. Select them in the Generate dialog.
          </p>
        </div>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={startAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add Example
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Blog Post Style Guide"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Example Content</Label>
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[200px] max-h-[400px] overflow-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 prose prose-sm max-w-none dark:prose-invert"
                data-placeholder="Paste an example of the content style you want the AI to follow..."
              />
              <p className="text-xs text-muted-foreground">
                Paste from a web page to preserve formatting (headers, bold, links, etc.).
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

      {examples.length === 0 && !showForm && (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            No examples yet. Add one to guide the AI&apos;s writing style.
          </p>
        </div>
      )}

      {examples.map((example) => (
        <Card key={example.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{example.name}</h4>
                <div
                  className="text-sm text-muted-foreground mt-1 line-clamp-3 prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: example.content }}
                />
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => startEdit(example)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(example.id)}
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

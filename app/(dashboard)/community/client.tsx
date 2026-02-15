"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ChevronUp, Plus, Search, Trash2 } from "lucide-react"

interface FeatureRequestItem {
  id: string
  title: string
  description: string
  status: string
  userId: string
  userName: string
  createdAt: string
  voteCount: number
  hasVoted: boolean
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
]

const STATUS_BADGE: Record<string, { label: string; variant: "outline" | "secondary" | "default" | "destructive" }> = {
  OPEN: { label: "Open", variant: "outline" },
  PLANNED: { label: "Planned", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "secondary" },
}

export function CommunityClient() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [requests, setRequests] = useState<FeatureRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState("trending")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = session?.user?.isSuperAdmin

  const fetchRequests = useCallback(async () => {
    const params = new URLSearchParams({ sort, status: statusFilter })
    if (search) params.set("search", search)
    try {
      const res = await fetch(`/api/feature-requests?${params}`)
      const data = await res.json()
      setRequests(data.data || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [sort, statusFilter, search])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit")
      }

      toast({ title: "Request submitted" })
      setDialogOpen(false)
      fetchRequests()
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to submit",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVote(id: string) {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              hasVoted: !r.hasVoted,
              voteCount: r.hasVoted ? r.voteCount - 1 : r.voteCount + 1,
            }
          : r
      )
    )

    try {
      const res = await fetch(`/api/feature-requests/${id}/vote`, {
        method: "POST",
      })

      if (!res.ok) throw new Error("Vote failed")

      const { data } = await res.json()
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, hasVoted: data.hasVoted, voteCount: data.voteCount }
            : r
        )
      )
    } catch {
      // Revert optimistic update
      fetchRequests()
    }
  }


  async function handleDelete(id: string) {
    if (!confirm("Delete this request?")) return

    try {
      const res = await fetch(`/api/feature-requests/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Delete failed")
      toast({ title: "Request deleted" })
      fetchRequests()
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feature Requests</h1>
          <p className="text-sm text-muted-foreground">
            Share your ideas and vote on features
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Feature Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fr-title">Title</Label>
                <Input
                  id="fr-title"
                  name="title"
                  placeholder="Short, descriptive title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fr-description">Description</Label>
                <Textarea
                  id="fr-description"
                  name="description"
                  placeholder="Describe the feature you'd like to see..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="top">Top</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {requests.length} post{requests.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Request list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-2/3 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No feature requests yet. Be the first to post one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const badge = STATUS_BADGE[r.status] || STATUS_BADGE.OPEN
            const canDelete =
              r.userId === session?.user?.id || isAdmin

            return (
              <Card key={r.id}>
                <div className="flex">
                  {/* Vote column */}
                  <button
                    className={`flex flex-col items-center justify-center px-4 border-r min-w-[60px] transition-colors ${
                      r.hasVoted
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => handleVote(r.id)}
                  >
                    <ChevronUp className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                      {r.voteCount}
                    </span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">
                          {r.title}
                        </h3>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </CardHeader>
                    {r.description && (
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {r.description}
                        </p>
                      </CardContent>
                    )}
                    <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground flex items-center gap-2">
                      <span>{r.userName}</span>
                      <span>&middot;</span>
                      <span>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      {canDelete && (
                        <>
                          <span>&middot;</span>
                          <button
                            className="text-destructive hover:underline inline-flex items-center gap-1"
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </>
                      )}
                    </CardFooter>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

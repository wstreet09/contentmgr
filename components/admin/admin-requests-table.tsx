"use client"

import { useEffect, useState, useCallback } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"

interface FeatureRequest {
  id: string
  title: string
  description: string
  status: string
  userName: string
  voteCount: number
  createdAt: string
}


export function AdminRequestsTable() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feature-requests")
      const data = await res.json()
      setRequests(data.data || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch("/api/admin/feature-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (!res.ok) throw new Error("Failed to update")
      toast({ title: "Status updated" })
      fetchRequests()
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" })
    }
  }

  async function handleDelete(request: FeatureRequest) {
    if (!confirm(`Delete "${request.title}"? This cannot be undone.`)) return

    try {
      const res = await fetch("/api/admin/feature-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id }),
      })

      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Request deleted" })
      fetchRequests()
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm p-4">Loading requests...</p>
  }

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-sm p-4">No feature requests yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Votes</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((r) => {
          return (
            <TableRow key={r.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{r.title}</p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {r.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{r.userName}</TableCell>
              <TableCell>
                <Badge variant="outline">{r.voteCount}</Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={r.status}
                  onValueChange={(val) => handleStatusChange(r.id, val)}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {new Date(r.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(r)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

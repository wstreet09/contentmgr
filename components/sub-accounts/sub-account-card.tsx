"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, MapPin, Star, Copy } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubAccountForm } from "@/components/sub-accounts/sub-account-form"
import { useToast } from "@/hooks/use-toast"

interface SubAccountCardProps {
  subAccount: {
    id: string
    name: string
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    phone: string | null
    email: string | null
    url: string | null
    contactUrl: string | null
    companyType: string | null
    isPrimary: boolean
    googleDriveFolderId: string | null
    projectId: string
  }
  onUpdate: () => void
}

export function SubAccountCard({ subAccount, onUpdate }: SubAccountCardProps) {
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const locationParts = [subAccount.city, subAccount.state]
    .filter(Boolean)
    .join(", ")

  async function handleDuplicate() {
    try {
      const res = await fetch("/api/sub-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: subAccount.projectId,
          name: `${subAccount.name} (Copy)`,
          address: subAccount.address,
          city: subAccount.city,
          state: subAccount.state,
          zip: subAccount.zip,
          phone: subAccount.phone,
          email: subAccount.email,
          url: subAccount.url,
          contactUrl: subAccount.contactUrl,
          companyType: subAccount.companyType,
        }),
      })
      if (!res.ok) throw new Error("Failed to duplicate")
      toast({ title: "Location duplicated" })
      onUpdate()
    } catch {
      toast({ title: "Failed to duplicate", variant: "destructive" })
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sub-accounts/${subAccount.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Location deleted" })
      setDeleteOpen(false)
      onUpdate()
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Link
              href={`/projects/${subAccount.projectId}/sub-accounts/${subAccount.id}`}
              className="flex-1 hover:underline"
            >
              <CardTitle className="text-lg flex items-center gap-2">
                {subAccount.name}
                {subAccount.isPrimary && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
              </CardTitle>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <SubAccountForm
                  projectId={subAccount.projectId}
                  subAccount={subAccount}
                  onSuccess={onUpdate}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem onSelect={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {locationParts && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{locationParts}</span>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {subAccount.companyType && (
              <Badge variant="secondary">{subAccount.companyType}</Badge>
            )}
            {subAccount.googleDriveFolderId ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Drive connected
              </Badge>
            ) : (
              <Link href={`/projects/${subAccount.projectId}/sub-accounts/${subAccount.id}?tab=settings`}>
                <Badge variant="outline" className="text-muted-foreground hover:text-foreground hover:border-foreground cursor-pointer">
                  Drive not connected
                </Badge>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{subAccount.name}&quot;?
              This will also delete all content batches. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

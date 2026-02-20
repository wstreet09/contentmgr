"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

interface SubAccountData {
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
}

interface SubAccountFormProps {
  projectId: string
  subAccount?: SubAccountData
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function SubAccountForm({
  projectId,
  subAccount,
  onSuccess,
  trigger,
}: SubAccountFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const isEdit = !!subAccount

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      projectId,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      url: formData.get("url") as string,
      contactUrl: formData.get("contactUrl") as string,
      companyType: formData.get("companyType") as string,
    }

    try {
      const apiUrl = isEdit
        ? `/api/sub-accounts/${subAccount.id}`
        : "/api/sub-accounts"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to save")
      }

      toast({ title: isEdit ? "Location updated" : "Location created" })
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Location" : "Add Location"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Austin Office"
              defaultValue={subAccount?.name || ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyType">Company type</Label>
            <Input
              id="companyType"
              name="companyType"
              placeholder="e.g. Plumbing, Legal, Medical"
              defaultValue={subAccount?.companyType || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={subAccount?.address || ""}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={subAccount?.city || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                defaultValue={subAccount?.state || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                name="zip"
                defaultValue={subAccount?.zip || ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={subAccount?.phone || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={subAccount?.email || ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com"
                defaultValue={subAccount?.url || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactUrl">Contact Us Link</Label>
              <Input
                id="contactUrl"
                name="contactUrl"
                type="url"
                placeholder="https://example.com/contact"
                defaultValue={subAccount?.contactUrl || ""}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

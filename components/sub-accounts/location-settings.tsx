"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface LocationSettingsProps {
  subAccountId: string
}

interface LocationData {
  name: string
  companyType: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  url: string
  contactUrl: string
}

export function LocationSettings({ subAccountId }: LocationSettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<LocationData>({
    name: "",
    companyType: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    url: "",
    contactUrl: "",
  })

  useEffect(() => {
    fetch(`/api/sub-accounts/${subAccountId}`)
      .then((r) => r.json())
      .then(({ data }) => {
        setForm({
          name: data.name || "",
          companyType: data.companyType || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          phone: data.phone || "",
          email: data.email || "",
          url: data.url || "",
          contactUrl: data.contactUrl || "",
        })
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to load location settings.", variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }, [subAccountId, toast])

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Location name is required.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/sub-accounts/${subAccountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      toast({ title: "Saved", description: "Location settings updated." })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  function update(field: keyof LocationData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Settings</CardTitle>
        <CardDescription>Manage the details for this location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Location Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Company Type</Label>
            <Input value={form.companyType} onChange={(e) => update("companyType", e.target.value)} placeholder="e.g. Law Firm, Dental Practice" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => update("state", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>ZIP Code</Label>
            <Input value={form.zip} onChange={(e) => update("zip", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input value={form.url} onChange={(e) => update("url", e.target.value)} placeholder="https://example.com" />
          </div>
          <div className="space-y-2">
            <Label>Contact Us Link</Label>
            <Input value={form.contactUrl} onChange={(e) => update("contactUrl", e.target.value)} placeholder="https://example.com/contact" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

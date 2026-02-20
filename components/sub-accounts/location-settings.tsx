"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2 } from "lucide-react"

interface InternalLink {
  url: string
  title: string
}

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
  const [links, setLinks] = useState<InternalLink[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [newLinkTitle, setNewLinkTitle] = useState("")
  const [savingLinks, setSavingLinks] = useState(false)
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
        try {
          setLinks(data.internalLinks ? JSON.parse(data.internalLinks) : [])
        } catch {
          setLinks([])
        }
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

  function addLink() {
    if (!newLinkUrl.trim() || !newLinkTitle.trim()) return
    setLinks((prev) => [...prev, { url: newLinkUrl.trim(), title: newLinkTitle.trim() }])
    setNewLinkUrl("")
    setNewLinkTitle("")
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSaveLinks() {
    setSavingLinks(true)
    try {
      const res = await fetch(`/api/sub-accounts/${subAccountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalLinks: JSON.stringify(links) }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast({ title: "Saved", description: "Internal links updated." })
    } catch {
      toast({ title: "Error", description: "Failed to save links.", variant: "destructive" })
    } finally {
      setSavingLinks(false)
    }
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
    <>
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

    <Card>
      <CardHeader>
        <CardTitle>Internal Links</CardTitle>
        <CardDescription>
          Add URLs from your website for the AI to link to in generated content. Your sitemap is also scraped automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={link.title} readOnly className="flex-1" />
                <Input value={link.url} readOnly className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeLink(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Page Title</Label>
            <Input
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="e.g. Our Services"
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">URL</Label>
            <Input
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://example.com/services"
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={addLink}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveLinks} disabled={savingLinks}>
            {savingLinks && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Links
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  )
}

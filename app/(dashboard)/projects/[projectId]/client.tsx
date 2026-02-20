"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SubAccountCard } from "@/components/sub-accounts/sub-account-card"
import { SubAccountForm } from "@/components/sub-accounts/sub-account-form"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin } from "lucide-react"

interface SubAccount {
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

interface ProjectDetailClientProps {
  project: { id: string; name: string }
}

export function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/sub-accounts?projectId=${project.id}`)
      const data = await res.json()
      setSubAccounts(data.data || [])
    } catch {
      setSubAccounts([])
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/article" className="hover:text-foreground">
          Article Content
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">Manage locations</p>
        </div>
        <SubAccountForm projectId={project.id} onSuccess={fetchSubAccounts} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : subAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No locations yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first location to start generating content.
          </p>
          <div className="mt-4">
            <SubAccountForm
              projectId={project.id}
              onSuccess={fetchSubAccounts}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subAccounts.map((sa) => (
            <SubAccountCard
              key={sa.id}
              subAccount={sa}
              onUpdate={fetchSubAccounts}
            />
          ))}
        </div>
      )}
    </div>
  )
}

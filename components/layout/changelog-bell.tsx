"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ChangelogEntry {
  date: string
  title: string
  description: string
}

export function ChangelogBell() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || [])
        setLastSeenAt(data.lastSeenAt)
        const count = data.lastSeenAt
          ? data.entries.filter(
              (e: ChangelogEntry) => new Date(e.date) > new Date(data.lastSeenAt)
            ).length
          : data.entries.length
        setUnreadCount(count)
      })
      .catch(() => {})
  }, [])

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen && unreadCount > 0) {
      fetch("/api/changelog", { method: "POST" }).catch(() => {})
      setUnreadCount(0)
      setLastSeenAt(new Date().toISOString())
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">What&apos;s new</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">What&apos;s New</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No updates yet.
            </p>
          ) : (
            entries.map((entry, i) => {
              const isNew =
                !lastSeenAt || new Date(entry.date) > new Date(lastSeenAt)
              return (
                <div
                  key={i}
                  className="border-b last:border-0 px-4 py-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    {isNew && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{entry.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

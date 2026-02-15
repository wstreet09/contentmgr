"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Settings, LogOut, FileText, Key, Users, Video, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/article", label: "Article Content", icon: LayoutDashboard },
  { href: "/video", label: "Video Content", icon: Video },
  { href: "/settings", label: "Profile", icon: Settings },
  { href: "/settings/api-keys", label: "API Keys", icon: Key },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/community", label: "Community", icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<{ name?: string; image?: string } | null>(null)

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then(({ data }) => setProfile(data))
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/article" className="flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5" />
          <span>Content Generator</span>
        </Link>
      </div>

      {profile?.image && (
        <div className="border-b p-3 flex justify-center">
          <img src={profile.image} alt="Profile" className="w-full rounded-md object-contain" />
        </div>
      )}

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

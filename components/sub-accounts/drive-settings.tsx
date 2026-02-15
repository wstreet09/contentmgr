"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DriveFolderPicker } from "./drive-folder-picker"
import { HardDrive, Unplug } from "lucide-react"

interface DriveSettingsProps {
  subAccountId: string
  hasTokens: boolean
  folderId: string | null
}

export function DriveSettings({ subAccountId, hasTokens, folderId }: DriveSettingsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [currentFolderId, setCurrentFolderId] = useState(folderId)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleFolderSelect(selectedFolderId: string, folderName: string) {
    try {
      const res = await fetch(`/api/sub-accounts/${subAccountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleDriveFolderId: selectedFolderId }),
      })
      if (!res.ok) throw new Error("Failed to save folder")
      setCurrentFolderId(selectedFolderId)
      toast({ title: "Drive folder set", description: `Selected: ${folderName}` })
    } catch {
      toast({ title: "Failed to save folder", variant: "destructive" })
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch("/api/google-drive/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subAccountId }),
      })
      if (!res.ok) throw new Error("Failed to disconnect")
      toast({ title: "Google Drive disconnected" })
      setCurrentFolderId(null)
      router.refresh()
    } catch {
      toast({ title: "Failed to disconnect", variant: "destructive" })
    } finally {
      setDisconnecting(false)
    }
  }

  if (!hasTokens) {
    return (
      <div className="rounded-lg border p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Google Drive</h3>
          <p className="text-sm text-muted-foreground">
            Connect Google Drive to automatically save generated content as Google Docs.
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
        <div>
          <Button asChild>
            <a href={`/api/google-drive/auth?subAccountId=${subAccountId}`}>
              <HardDrive className="mr-2 h-4 w-4" />
              Connect Google Drive
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Google Drive</h3>
        <p className="text-sm text-muted-foreground">
          Generated content will be saved as Google Docs in the selected folder.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>
        {currentFolderId && (
          <span className="text-sm text-muted-foreground">
            Folder ID: {currentFolderId.slice(0, 12)}...
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DriveFolderPicker
          subAccountId={subAccountId}
          currentFolderId={currentFolderId}
          onSelect={handleFolderSelect}
          trigger={
            <Button variant="outline">
              <HardDrive className="mr-2 h-4 w-4" />
              {currentFolderId ? "Change folder" : "Select folder"}
            </Button>
          }
        />
        <Button
          variant="outline"
          onClick={handleDisconnect}
          disabled={disconnecting}
        >
          <Unplug className="mr-2 h-4 w-4" />
          {disconnecting ? "Disconnecting..." : "Disconnect"}
        </Button>
      </div>
    </div>
  )
}

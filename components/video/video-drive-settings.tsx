"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { VideoFolderPicker } from "./video-folder-picker"
import { HardDrive, Unplug, Sheet, Link } from "lucide-react"

interface VideoDriveSettingsProps {
  videoProjectId: string
  hasTokens: boolean
  folderId: string | null
  sheetId: string | null
  sheetUrl: string | null
}

export function VideoDriveSettings({
  videoProjectId,
  hasTokens,
  folderId,
  sheetId,
  sheetUrl,
}: VideoDriveSettingsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [currentFolderId, setCurrentFolderId] = useState(folderId)
  const [currentSheetId, setCurrentSheetId] = useState(sheetId)
  const [currentSheetUrl, setCurrentSheetUrl] = useState(sheetUrl)
  const [disconnecting, setDisconnecting] = useState(false)
  const [creatingSheet, setCreatingSheet] = useState(false)
  const [sheetUrlInput, setSheetUrlInput] = useState("")
  const [connectingSheet, setConnectingSheet] = useState(false)

  async function handleFolderSelect(selectedFolderId: string, folderName: string) {
    try {
      const res = await fetch(`/api/video/projects/${videoProjectId}`, {
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

  async function handleCreateSheet() {
    if (!currentFolderId) return
    setCreatingSheet(true)
    try {
      const res = await fetch("/api/video/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoProjectId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create sheet")
      }
      const { data } = await res.json()
      setCurrentSheetId(data.sheetId)
      setCurrentSheetUrl(data.sheetUrl)
      toast({ title: "Tracking sheet created" })
    } catch (err) {
      toast({
        title: "Failed to create tracking sheet",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setCreatingSheet(false)
    }
  }

  async function handleConnectSheet() {
    const url = sheetUrlInput.trim()
    if (!url) return

    // Parse sheet ID from URL: https://docs.google.com/spreadsheets/d/{SHEET_ID}/...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    if (!match) {
      toast({ title: "Invalid URL", description: "Please paste a valid Google Sheets URL.", variant: "destructive" })
      return
    }

    const parsedSheetId = match[1]
    const parsedSheetUrl = `https://docs.google.com/spreadsheets/d/${parsedSheetId}`

    setConnectingSheet(true)
    try {
      const res = await fetch(`/api/video/projects/${videoProjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId: parsedSheetId, sheetUrl: parsedSheetUrl }),
      })
      if (!res.ok) throw new Error("Failed to connect sheet")
      setCurrentSheetId(parsedSheetId)
      setCurrentSheetUrl(parsedSheetUrl)
      setSheetUrlInput("")
      toast({ title: "Tracking sheet connected" })
    } catch {
      toast({ title: "Failed to connect sheet", variant: "destructive" })
    } finally {
      setConnectingSheet(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch("/api/video/google-drive/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoProjectId }),
      })
      if (!res.ok) throw new Error("Failed to disconnect")
      toast({ title: "Google Drive disconnected" })
      setCurrentFolderId(null)
      setCurrentSheetId(null)
      setCurrentSheetUrl(null)
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
          <h3 className="text-lg font-semibold">Google Drive & Sheets</h3>
          <p className="text-sm text-muted-foreground">
            Connect Google Drive to create tracking sheets and save generated content as Google Docs.
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
        <div>
          <Button asChild>
            <a href={`/api/video/google-drive/auth?videoProjectId=${videoProjectId}`}>
              <HardDrive className="mr-2 h-4 w-4" />
              Connect Google Drive
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Note: You must enable the Google Sheets API in your Google Cloud Console for sheet creation to work.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Google Drive & Sheets</h3>
        <p className="text-sm text-muted-foreground">
          Generated content will be saved as Google Docs. A tracking sheet manages the workflow.
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

      <div className="flex items-center gap-2 flex-wrap">
        <VideoFolderPicker
          videoProjectId={videoProjectId}
          currentFolderId={currentFolderId}
          onSelect={handleFolderSelect}
          trigger={
            <Button variant="outline">
              <HardDrive className="mr-2 h-4 w-4" />
              {currentFolderId ? "Change folder" : "Select folder"}
            </Button>
          }
        />

        {currentFolderId && !currentSheetId && (
          <Button onClick={handleCreateSheet} disabled={creatingSheet}>
            <Sheet className="mr-2 h-4 w-4" />
            {creatingSheet ? "Creating..." : "Create Tracking Sheet"}
          </Button>
        )}

        {!currentSheetId && (
          <div className="flex items-center gap-2 w-full">
            <Input
              placeholder="Paste Google Sheet URL..."
              value={sheetUrlInput}
              onChange={(e) => setSheetUrlInput(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleConnectSheet}
              disabled={connectingSheet || !sheetUrlInput.trim()}
            >
              <Link className="mr-2 h-4 w-4" />
              {connectingSheet ? "Connecting..." : "Connect Sheet"}
            </Button>
          </div>
        )}

        {currentSheetId && currentSheetUrl && (
          <a href={currentSheetUrl} target="_blank" rel="noopener noreferrer">
            <Badge variant="outline" className="text-blue-600 border-blue-600 cursor-pointer hover:bg-blue-50">
              <Sheet className="mr-1 h-3 w-3" />
              Open Tracking Sheet
            </Badge>
          </a>
        )}

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

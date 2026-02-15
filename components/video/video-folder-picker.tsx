"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Folder, ChevronRight, Check } from "lucide-react"

interface DriveFolder {
  id: string
  name: string
}

interface VideoFolderPickerProps {
  videoProjectId: string
  currentFolderId: string | null
  onSelect: (folderId: string, folderName: string) => void
  trigger?: React.ReactNode
}

export function VideoFolderPicker({
  videoProjectId,
  currentFolderId,
  onSelect,
  trigger,
}: VideoFolderPickerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [path, setPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "My Drive" },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(currentFolderId)

  const currentParentId = path[path.length - 1].id

  useEffect(() => {
    if (!open) return

    setLoading(true)
    const params = new URLSearchParams({ videoProjectId })
    if (currentParentId) params.set("parentId", currentParentId)

    fetch(`/api/video/google-drive/folders?${params}`)
      .then((res) => res.json())
      .then((data) => setFolders(data.data || []))
      .catch(() => {
        toast({ title: "Failed to load folders", variant: "destructive" })
        setFolders([])
      })
      .finally(() => setLoading(false))
  }, [open, currentParentId, videoProjectId, toast])

  function navigateInto(folder: DriveFolder) {
    setPath((prev) => [...prev, { id: folder.id, name: folder.name }])
  }

  function navigateToIndex(index: number) {
    setPath((prev) => prev.slice(0, index + 1))
  }

  function handleSelect() {
    if (!selectedId) return
    const selectedFolder = folders.find((f) => f.id === selectedId)
    if (selectedFolder) {
      onSelect(selectedFolder.id, selectedFolder.name)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Choose folder</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Google Drive folder</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1 text-sm flex-wrap">
          {path.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <button
                className="hover:text-foreground text-muted-foreground"
                onClick={() => navigateToIndex(i)}
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>

        <ScrollArea className="h-64 border rounded-md">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading folders...
            </div>
          ) : folders.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No folders found
            </div>
          ) : (
            <div className="p-1">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent ${
                    selectedId === folder.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedId(folder.id)}
                  onDoubleClick={() => navigateInto(folder)}
                >
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{folder.name}</span>
                  {selectedId === folder.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateInto(folder)
                    }}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedId}>
            Select folder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

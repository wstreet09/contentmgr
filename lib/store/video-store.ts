import { create } from "zustand"

export interface VideoTopicRow {
  id: string
  title: string
  hookStatus: string
  descriptionStatus: string
  miniBlogStatus: string
  videoLink: string
}

function createEmptyRow(): VideoTopicRow {
  return {
    id: crypto.randomUUID(),
    title: "",
    hookStatus: "PENDING",
    descriptionStatus: "PENDING",
    miniBlogStatus: "PENDING",
    videoLink: "",
  }
}

interface VideoStore {
  rows: VideoTopicRow[]
  selectedIds: Set<string>
  isDirty: boolean

  setRows: (rows: VideoTopicRow[]) => void
  addRow: () => void
  addRows: (rows: VideoTopicRow[]) => void
  deleteRows: (ids: string[]) => void
  updateCell: (id: string, field: keyof VideoTopicRow, value: string) => void
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  markClean: () => void
}

export const useVideoStore = create<VideoStore>((set) => ({
  rows: [],
  selectedIds: new Set(),
  isDirty: false,

  setRows: (rows) => set({ rows, isDirty: false }),

  addRow: () =>
    set((state) => ({
      rows: [...state.rows, createEmptyRow()],
      isDirty: true,
    })),

  addRows: (newRows) =>
    set((state) => ({
      rows: [...state.rows, ...newRows],
      isDirty: true,
    })),

  deleteRows: (ids) =>
    set((state) => {
      const idSet = new Set(ids)
      const newSelected = new Set(state.selectedIds)
      ids.forEach((id) => newSelected.delete(id))
      return {
        rows: state.rows.filter((r) => !idSet.has(r.id)),
        selectedIds: newSelected,
        isDirty: true,
      }
    }),

  updateCell: (id, field, value) =>
    set((state) => ({
      rows: state.rows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
      isDirty: true,
    })),

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    }),

  selectAll: () =>
    set((state) => ({
      selectedIds: new Set(state.rows.map((r) => r.id)),
    })),

  clearSelection: () => set({ selectedIds: new Set() }),

  markClean: () => set({ isDirty: false }),
}))

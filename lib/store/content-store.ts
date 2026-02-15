import { create } from "zustand"

export interface ContentRow {
  id: string
  title: string
  contentType: string
  serviceArea: string
  targetAudience: string
  geolocation: string
  targetKeywords: string
  includeCta: boolean
  status: string
  generatedContent?: string
}

function createEmptyRow(): ContentRow {
  return {
    id: crypto.randomUUID(),
    title: "",
    contentType: "BLOG_POST",
    serviceArea: "",
    targetAudience: "",
    geolocation: "",
    targetKeywords: "",
    includeCta: true,
    status: "DRAFT",
  }
}

interface ContentStore {
  rows: ContentRow[]
  selectedIds: Set<string>
  isDirty: boolean

  setRows: (rows: ContentRow[]) => void
  addRow: () => void
  addRows: (rows: ContentRow[]) => void
  deleteRows: (ids: string[]) => void
  duplicateRows: (ids: string[]) => void
  updateCell: (id: string, field: keyof ContentRow, value: string | boolean) => void
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  markClean: () => void
}

export const useContentStore = create<ContentStore>((set) => ({
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

  duplicateRows: (ids) =>
    set((state) => {
      const idSet = new Set(ids)
      const dupes = state.rows
        .filter((r) => idSet.has(r.id))
        .map((r) => ({ ...r, id: crypto.randomUUID(), status: "DRAFT" }))
      return {
        rows: [...state.rows, ...dupes],
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

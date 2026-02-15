import { describe, it, expect, beforeEach } from "vitest"
import { useContentStore } from "@/lib/store/content-store"

describe("content store", () => {
  beforeEach(() => {
    useContentStore.setState({
      rows: [],
      selectedIds: new Set(),
      isDirty: false,
    })
  })

  it("starts with empty rows", () => {
    expect(useContentStore.getState().rows).toHaveLength(0)
  })

  it("addRow creates a new draft row", () => {
    useContentStore.getState().addRow()
    const { rows, isDirty } = useContentStore.getState()
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe("DRAFT")
    expect(rows[0].contentType).toBe("BLOG_POST")
    expect(isDirty).toBe(true)
  })

  it("deleteRows removes specified rows", () => {
    useContentStore.getState().addRow()
    useContentStore.getState().addRow()
    const ids = useContentStore.getState().rows.map((r) => r.id)
    useContentStore.getState().deleteRows([ids[0]])
    expect(useContentStore.getState().rows).toHaveLength(1)
    expect(useContentStore.getState().rows[0].id).toBe(ids[1])
  })

  it("duplicateRows creates copies with new IDs", () => {
    useContentStore.getState().addRow()
    const originalId = useContentStore.getState().rows[0].id
    useContentStore.getState().duplicateRows([originalId])
    const { rows } = useContentStore.getState()
    expect(rows).toHaveLength(2)
    expect(rows[0].id).not.toBe(rows[1].id)
    expect(rows[1].status).toBe("DRAFT")
  })

  it("updateCell modifies the correct field", () => {
    useContentStore.getState().addRow()
    const id = useContentStore.getState().rows[0].id
    useContentStore.getState().updateCell(id, "title", "My Blog Post")
    expect(useContentStore.getState().rows[0].title).toBe("My Blog Post")
  })

  it("toggleSelect adds and removes from selection", () => {
    useContentStore.getState().addRow()
    const id = useContentStore.getState().rows[0].id
    useContentStore.getState().toggleSelect(id)
    expect(useContentStore.getState().selectedIds.has(id)).toBe(true)
    useContentStore.getState().toggleSelect(id)
    expect(useContentStore.getState().selectedIds.has(id)).toBe(false)
  })

  it("selectAll selects all rows", () => {
    useContentStore.getState().addRow()
    useContentStore.getState().addRow()
    useContentStore.getState().selectAll()
    expect(useContentStore.getState().selectedIds.size).toBe(2)
  })

  it("clearSelection empties the selection", () => {
    useContentStore.getState().addRow()
    useContentStore.getState().selectAll()
    useContentStore.getState().clearSelection()
    expect(useContentStore.getState().selectedIds.size).toBe(0)
  })

  it("markClean resets isDirty to false", () => {
    useContentStore.getState().addRow()
    expect(useContentStore.getState().isDirty).toBe(true)
    useContentStore.getState().markClean()
    expect(useContentStore.getState().isDirty).toBe(false)
  })

  it("setRows replaces rows and marks clean", () => {
    useContentStore.getState().addRow()
    useContentStore.getState().setRows([
      { id: "x", title: "Loaded", contentType: "FAQ_PAGE", serviceArea: "", targetAudience: "", geolocation: "", targetKeywords: "", includeCta: false, status: "COMPLETED" },
    ])
    const { rows, isDirty } = useContentStore.getState()
    expect(rows).toHaveLength(1)
    expect(rows[0].title).toBe("Loaded")
    expect(isDirty).toBe(false)
  })
})

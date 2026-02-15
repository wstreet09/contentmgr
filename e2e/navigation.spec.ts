import { test, expect } from "@playwright/test"

test.describe("Navigation", () => {
  test("home page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/")
    // Should either show the home page or redirect to login
    const url = page.url()
    expect(url).toMatch(/\/(login)?$/)
  })

  test("settings redirects unauthenticated users", async ({ page }) => {
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/login/)
  })

  test("projects redirects unauthenticated users", async ({ page }) => {
    await page.goto("/projects/test-id")
    await expect(page).toHaveURL(/\/login/)
  })
})

import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test("register page loads", async ({ page }) => {
    await page.goto("/register")
    await expect(page.getByRole("heading", { name: /create.*account/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/article")
    await expect(page).toHaveURL(/\/login/)
  })

  test("login link from register page works", async ({ page }) => {
    await page.goto("/register")
    await page.getByRole("link", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test("register link from login page works", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("link", { name: /sign up|register|create/i }).click()
    await expect(page).toHaveURL(/\/register/)
  })
})

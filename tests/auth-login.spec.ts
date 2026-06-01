import { test, expect } from "@playwright/test"

test.describe("Login Flow", () => {
  test("Login page renders wallet options", async ({ page }) => {
    await page.goto("/login")

    await expect(page.locator("text=Sign in")).toBeVisible()
    await expect(page.locator("text=WalletConnect").or(page.locator("text=WalletConnect"))).toBeVisible()
  })

  test("shows WalletConnect QR code", async ({ page }) => {
    await page.goto("/login")

    await page.getByRole("button", { name: /WalletConnect/i }).click()
    await page.waitForSelector("canvas[aria-label*='QR code']", { timeout: 15000 })

    await expect(page.locator("canvas[aria-label*='QR code']")).toBeVisible()
    await expect(page.locator("text=Scan with your wallet app")).toBeVisible()
  })

  test("navigation to register page", async ({ page }) => {
    await page.goto("/login")

    await page.getByRole("link", { name: /register/i }).click()
    await expect(page).toHaveURL(/\/register/)
  })

  test("redirects to dashboard if already authenticated", async ({ page }) => {
    // Set a fake token cookie to simulate authenticated state
    await page.context().addCookies([
      { name: "moistello_token", value: "test-jwt-token", domain: "localhost", path: "/" },
    ])

    await page.goto("/login")
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })

  test("passkey autofill option is visible", async ({ page }) => {
    await page.goto("/login")

    await expect(page.locator("text=Passkey").or(page.locator("[data-testid='passkey-option']"))).toBeVisible()
  })

  test("error state displays retry button", async ({ page }) => {
    await page.goto("/login")

    // Trigger an error by providing bad connection params
    // The page should show error UI with retry capability
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "connection_timeout", message: "Connection timed out" },
      }))
    })

    await expect(page.locator("text=try again").or(page.locator("text=Retry"))).toBeVisible({ timeout: 3000 })
  })
})

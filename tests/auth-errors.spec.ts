import { test, expect } from "@playwright/test"

test.describe("Auth Error Handling", () => {
  test("shows error for invalid wallet connection", async ({ page }) => {
    await page.goto("/login")

    // Attempt to trigger an error state
    // The exact selector depends on the error UI implementation
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "connection_rejected", message: "Connection was rejected." },
      }))
    })

    await expect(page.locator("text=rejected").or(page.locator("[data-testid='error-message']"))).toBeVisible({ timeout: 3000 })
  })

  test("shows retry button after error", async ({ page }) => {
    await page.goto("/login")

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "relay_down", message: "Relay is down." },
      }))
    })

    await expect(page.locator("button:has-text('Retry')").or(page.locator("text=try again"))).toBeVisible({ timeout: 3000 })
  })

  test("handles network timeout gracefully", async ({ page }) => {
    await page.goto("/login")

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "connection_timeout", message: "Connection timed out." },
      }))
    })

    await expect(page.locator("text=timeout").or(page.locator("text=try again"))).toBeVisible({ timeout: 3000 })
  })

  test("handles auth server error", async ({ page }) => {
    await page.goto("/login")

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "auth_server_error", message: "Server error." },
      }))
    })

    await expect(page.locator("[data-testid='error-message']").or(page.locator("text=error"))).toBeVisible({ timeout: 3000 })
  })

  test("error clears when user retries", async ({ page }) => {
    await page.goto("/login")

    // Trigger error
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "connection_timeout", message: "Timed out." },
      }))
    })

    // Clear error (simulate retry)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:retry"))
    })

    // Error state should be gone, loading or idle state should show
    await expect(page.locator("text=Sign in").or(page.locator("text=Connect"))).toBeVisible({ timeout: 3000 })
  })
})

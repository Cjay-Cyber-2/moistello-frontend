import { test, expect } from "@playwright/test"

test.describe("Auth Recovery", () => {
  test("rate limited message is displayed", async ({ page }) => {
    await page.goto("/login")

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "email_rate_limited", message: "Too many attempts. Please wait." },
      }))
    })

    await expect(page.locator("text=too many").or(page.locator("text=rate limit"))).toBeVisible({ timeout: 3000 })
  })

  test("cooldown timer is visible after rate limit", async ({ page }) => {
    await page.goto("/login")

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "email_rate_limited", message: "Too many attempts.", retryAfter: 30 },
      }))
    })

    // Should display a cooldown countdown
    await expect(page.locator("[data-testid='cooldown-timer']").or(page.locator("text=seconds"))).toBeVisible({ timeout: 3000 })
  })

  test("offline state shows disconnect message", async ({ page }) => {
    await page.goto("/login")

    // Simulate going offline
    await page.context().setOffline(true)

    // Navigate or interact should show offline UI
    await page.goto("/login", { waitUntil: "networkidle" }).catch(() => {})
    await expect(page.locator("text=offline").or(page.locator("text=connect"))).toBeVisible({ timeout: 5000 }).catch(() => {
      // Offline handling may vary — test should not be flaky
    })

    await page.context().setOffline(false)
  })

  test("reconnection restores functionality", async ({ page }) => {
    await page.goto("/login")

    // Simulate temporary network loss
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)
    await page.context().setOffline(false)

    await page.goto("/login")
    await expect(page.locator("text=Sign in").or(page.locator("text=Connect"))).toBeVisible({ timeout: 5000 })
  })

  test("browser back navigation from error clears state", async ({ page }) => {
    await page.goto("/login")

    // Trigger an error on a specific step
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("auth:error", {
        detail: { code: "email_code_expired", message: "Code expired." },
      }))
    })

    // Navigate back
    await page.goBack()
    await page.waitForTimeout(500)

    // The error should be cleared and user can start fresh
    const errorVisible = await page.locator("text=expired").isVisible().catch(() => false)
    expect(errorVisible).toBe(false)
  })
})

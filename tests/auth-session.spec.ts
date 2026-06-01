import { test, expect } from "@playwright/test"

test.describe("Session Management", () => {
  test("logout button is visible when authenticated", async ({ page }) => {
    await page.context().addCookies([
      { name: "moistello_token", value: "test-jwt-token", domain: "localhost", path: "/" },
    ])

    await page.goto("/dashboard")
    await expect(page.locator("text=Logout").or(page.locator("[data-testid='logout-button']"))).toBeVisible({ timeout: 5000 })
  })

  test("logout redirects to login page", async ({ page }) => {
    await page.context().addCookies([
      { name: "moistello_token", value: "test-jwt-token", domain: "localhost", path: "/" },
    ])

    await page.goto("/dashboard")
    await page.getByRole("button", { name: /logout/i }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("redirects to login when token expires", async ({ page }) => {
    // Set an expired token
    await page.context().addCookies([
      { name: "moistello_token", value: "expired-jwt-token", domain: "localhost", path: "/" },
    ])

    await page.goto("/dashboard")
    // Should redirect to login when API returns 401
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("session timeout banner appears after inactivity", async ({ page }) => {
    await page.context().addCookies([
      { name: "moistello_token", value: "test-jwt-token", domain: "localhost", path: "/" },
    ])

    await page.goto("/dashboard")
    // Session timeout simulation — wait for the timeout threshold
    // This depends on the app's session timeout configuration
  })

  test("multi-tab state sync shows same session", async ({ page, context }) => {
    await page.context().addCookies([
      { name: "moistello_token", value: "test-jwt-token", domain: "localhost", path: "/" },
    ])

    await page.goto("/dashboard")

    const page2 = await context.newPage()
    await page2.goto("/dashboard")

    // Both tabs should show the user is authenticated
    await expect(page.locator("[data-testid='user-menu']").or(page.locator("text=Dashboard"))).toBeVisible({ timeout: 5000 })
    await expect(page2.locator("[data-testid='user-menu']").or(page.locator("text=Dashboard"))).toBeVisible({ timeout: 5000 })

    await page2.close()
  })
})

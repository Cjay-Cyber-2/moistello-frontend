import { test, expect } from "@playwright/test"

test.describe("Registration Flow", () => {
  test("Register page renders wallet options and profile form", async ({ page }) => {
    await page.goto("/register")

    await expect(page.locator("text=Create account").or(page.locator("text=Register"))).toBeVisible()
  })

  test("WalletConnect generates QR code on register", async ({ page }) => {
    await page.goto("/register")

    await page.getByRole("button", { name: /walletconnect/i }).click()
    await page.waitForSelector("canvas[aria-label*='QR code']", { timeout: 15000 })

    const canvas = page.locator("canvas[aria-label*='QR code']")
    await expect(canvas).toBeVisible()
    await expect(page.locator("text=Scan with your wallet app")).toBeVisible()
    await expect(page.locator("text=Or use this link:")).toBeVisible()

    const codeBlock = page.locator("code").first()
    await expect(codeBlock).toBeVisible()
    const codeText = await codeBlock.textContent()
    expect(codeText).toMatch(/wc:/)
  })

  test("shows email verification step when email is required", async ({ page }) => {
    await page.goto("/register")

    // Click connect with a wallet option
    await page.getByRole("button", { name: /freighter|passkey/i }).first().click()

    // Profile step should show email field
    await expect(page.locator("input[type='email']").or(page.locator("input[name='email']"))).toBeVisible({ timeout: 5000 })
  })

  test("validation shows errors for empty required fields", async ({ page }) => {
    await page.goto("/register")

    // Try to submit with empty fields
    await page.getByRole("button", { name: /submit|continue|next/i }).first().click()

    // Should show validation errors
    await expect(page.locator("text=required").first()).toBeVisible({ timeout: 3000 })
  })

  test("navigation to login page", async ({ page }) => {
    await page.goto("/register")

    await page.getByRole("link", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})

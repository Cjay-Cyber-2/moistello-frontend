// @vitest-environment node
import { describe, expect, it, vi, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { middleware } from "@/middleware"
import { API_CSP } from "@/lib/security/api-csp.mjs"

function makeRequest(pathname: string) {
  return new NextRequest(`http://localhost${pathname}`)
}

function cspHeader(response: Response): string | undefined {
  return response.headers.get("Content-Security-Policy") ?? undefined
}

describe("middleware – CSP selection", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("serves the nonce-based page CSP for HTML routes", () => {
    vi.stubEnv("NODE_ENV", "production")
    const res = middleware(makeRequest("/circles"))
    const csp = cspHeader(res)
    expect(csp).toBeDefined()
    expect(csp).toContain("'nonce-")
    expect(csp).toContain("'strict-dynamic'")
    expect(csp).not.toContain("'unsafe-eval'")
  })

  it("keeps 'unsafe-eval' out of the production page policy", () => {
    vi.stubEnv("NODE_ENV", "production")
    const csp = cspHeader(middleware(makeRequest("/"))) ?? ""
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).toContain("'wasm-unsafe-eval'")
  })

  it("serves the static API policy for API routes", () => {
    vi.stubEnv("NODE_ENV", "production")
    const res = middleware(makeRequest("/api/auth/session"))
    expect(cspHeader(res)).toBe(API_CSP)
  })

  it("API responses never carry page-script allowances", () => {
    vi.stubEnv("NODE_ENV", "production")
    const csp = cspHeader(middleware(makeRequest("/api/wallet/hmac/key"))) ?? ""
    expect(csp).not.toContain("nonce-")
    expect(csp).not.toContain("strict-dynamic")
    expect(csp).not.toContain("unsafe-eval")
    expect(csp).not.toContain("unsafe-inline")
  })

  it("protected-page redirects still carry the page CSP", () => {
    vi.stubEnv("NODE_ENV", "production")
    const res = middleware(makeRequest("/settings"))
    expect(res.status).toBe(307)
    const csp = cspHeader(res)
    expect(csp).toContain("'nonce-")
  })
})
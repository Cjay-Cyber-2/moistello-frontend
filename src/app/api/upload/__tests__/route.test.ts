// @vitest-environment node
import { NextRequest } from "next/server"
import { describe, expect, it, vi, afterEach } from "vitest"
import { POST } from "../route"

function makeUploadRequest() {
  const form = new FormData()
  form.append("file", new File(["test"], "test.md", { type: "text/markdown" }))
  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: form,
  })
}

describe("POST /api/upload – production guard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns 404 in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const res = await POST(makeUploadRequest())
    expect(res.status).toBe(404)
  })

  it("returns 404 with JSON error body in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const res = await POST(makeUploadRequest())
    const body = await res.json()
    expect(body).toEqual({ error: "Not found" })
  })
})

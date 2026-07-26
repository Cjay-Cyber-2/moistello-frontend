import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import { NextRequest } from "next/server"

vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: vi.fn().mockResolvedValue({
    challenge: "reg-challenge-abc",
    rp: { name: "Moistello", id: "localhost" },
    user: { id: "user-123", name: "user@test.com", displayName: "user@test.com" },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "required" },
    timeout: 120000,
    attestation: "none",
  }),
  generateAuthenticationOptions: vi.fn().mockResolvedValue({
    challenge: "auth-challenge-xyz",
    rpId: "localhost",
    allowCredentials: [{ id: "cred-id-123", transports: ["internal"] }],
    userVerification: "required",
    timeout: 60000,
  }),
  verifyRegistrationResponse: vi.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credential: {
        id: "new-cred-id",
        publicKey: new Uint8Array(32).fill(42),
        counter: 0,
        transports: ["internal"],
      },
    },
  }),
  verifyAuthenticationResponse: vi.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      newCounter: 1,
      credentialId: "cred-id-123",
    },
  }),
}))

import { POST as generateOptions } from "../generate-options/route"
import { POST as register } from "../register/route"
import { POST as authVerify } from "../auth-verify/route"

function writeSessionFixture(userId = "user-123") {
  const contentDir = path.join(process.cwd(), "content")
  fs.mkdirSync(contentDir, { recursive: true })
  fs.writeFileSync(path.join(contentDir, "sessions.json"), JSON.stringify([{ token: "session-token", userId, createdAt: Date.now() }], null, 2))
  fs.writeFileSync(path.join(contentDir, "users.json"), JSON.stringify([{ id: userId, username: "demo", role: "user" }], null, 2))
}

function makeRequest(body: unknown, ip = "127.0.0.1") {
  return new NextRequest("http://localhost:1110/api/auth/passkey/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
      Cookie: "moistello_session=session-token",
    },
    body: JSON.stringify(body),
  })
}

function makeUnauthenticatedRequest(body: unknown) {
  return new NextRequest("http://localhost:1110/api/auth/passkey/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

describe("passkey API security", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writeSessionFixture()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("requires authentication for generate-options", async () => {
    const req = makeUnauthenticatedRequest({ mode: "register" })

    const res = await generateOptions(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: "unauthenticated" })
  })

  it("returns registration options for an authenticated user", async () => {
    const res = await generateOptions(makeRequest({ mode: "register" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.options).toBeDefined()
    expect(data.options.challenge).toBe("reg-challenge-abc")
  })

  it("requires authentication for register", async () => {
    const req = makeUnauthenticatedRequest({ attestation: { id: "test" } })

    const res = await register(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: "unauthenticated" })
  })

  it("associates a registered credential with the authenticated user", async () => {
    await generateOptions(makeRequest({ mode: "register" }))
    const res = await register(makeRequest({ attestation: { rawId: "new-id", response: { clientDataJSON: btoa(JSON.stringify({ challenge: "reg-challenge-abc" })) } } }))

    expect(res.status).toBe(200)
    const { getCredential } = await import("@/lib/passkey/store")
    const credential = await getCredential("new-cred-id")
    expect(credential?.userId).toBe("user-123")
  })

  it("requires authentication for auth-verify", async () => {
    const req = makeUnauthenticatedRequest({ credentialId: "cred-id-123", assertion: {} })

    const res = await authVerify(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: "unauthenticated" })
  })

  it("rate limits repeated passkey requests per IP", async () => {
    const first = await generateOptions(makeRequest({ mode: "register" }, "192.0.2.10"))
    expect(first.status).toBe(200)

    let blocked = 0
    for (let i = 0; i < 6; i += 1) {
      const res = await generateOptions(makeRequest({ mode: "register" }, "192.0.2.10"))
      if (res.status === 429) blocked += 1
    }

    expect(blocked).toBeGreaterThan(0)
  })
})

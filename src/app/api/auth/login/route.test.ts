// @vitest-environment node
import crypto from "crypto"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import fs from "fs"
import { POST } from "./route"

function makeHash(password: string, salt: string, iterations: number): string {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex")
}

function makeRequest(body: unknown, ip = "127.0.0.1") {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  })
}

const SALT = "testsalt123"

const users600k = [
  {
    id: "user-600k",
    username: "alice",
    passwordHash: makeHash("correct-horse", SALT, 600_000),
    passwordSalt: SALT,
    role: "admin",
  },
]

const users100k = [
  {
    id: "user-100k",
    username: "bob",
    passwordHash: makeHash("battery-staple", SALT, 100_000),
    passwordSalt: SALT,
    role: "admin",
  },
]

let writtenUsers: unknown[] = []

const existsSyncSpy = vi.spyOn(fs, "existsSync")
const readFileSyncSpy = vi.spyOn(fs, "readFileSync")
const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync")

function setupFsMock(usersFixture: typeof users600k) {
  writtenUsers = []

  existsSyncSpy.mockImplementation(((...args: unknown[]) => {
    const p = args[0] as string
    if (p.includes("users.json")) return true
    if (p.includes("sessions.json")) return true
    return false
  }) as typeof fs.existsSync)
  readFileSyncSpy.mockImplementation(((...args: unknown[]) => {
    const p = args[0] as string
    if (p.includes("users.json")) return JSON.stringify(usersFixture)
    if (p.includes("sessions.json")) return "[]"
    return "[]"
  }) as typeof fs.readFileSync)
  writeFileSyncSpy.mockImplementation(((...args: unknown[]) => {
    const _p = args[0] as string
    const data = args[1] as string
    const parsed = JSON.parse(data) as unknown[]
    if (_p.includes("users.json")) writtenUsers = parsed
  }) as typeof fs.writeFileSync)
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when username or password is missing", async () => {
    setupFsMock(users600k)
    const res = await POST(makeRequest({ username: "alice" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/required/i)
  })

  it("returns 401 for an unknown username", async () => {
    setupFsMock(users600k)
    const res = await POST(makeRequest({ username: "nobody", password: "whatever" }))
    expect(res.status).toBe(401)
  })

  it("returns 401 for a wrong password", async () => {
    setupFsMock(users600k)
    const res = await POST(makeRequest({ username: "alice", password: "wrong-password" }))
    expect(res.status).toBe(401)
  })

  it("accepts a correct password against a 600K hash without migration", async () => {
    setupFsMock(users600k)
    const res = await POST(makeRequest({ username: "alice", password: "correct-horse" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.user.username).toBe("alice")
  })

  it("accepts a correct password against a legacy 100K hash and migrates to 600K", async () => {
    setupFsMock(users100k)
    const res = await POST(makeRequest({ username: "bob", password: "battery-staple" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(writtenUsers).toHaveLength(1)
    const migrated = writtenUsers[0] as { passwordHash: string; passwordSalt: string }
    const reHashed = makeHash("battery-staple", migrated.passwordSalt, 600_000)
    expect(migrated.passwordHash).toBe(reHashed)
  })

  it("sets the session cookie on a successful login", async () => {
    setupFsMock(users600k)
    const res = await POST(makeRequest({ username: "alice", password: "correct-horse" }))
    expect(res.status).toBe(200)
    const setCookie = res.headers.get("set-cookie")
    expect(setCookie).toContain("moistello_session")
  })
})

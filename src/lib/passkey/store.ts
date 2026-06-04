const CHALLENGE_TTL_MS = 5 * 60 * 1000

interface ChallengeEntry {
  challenge: string
  expiresAt: number
}

export type CredentialRecord = {
  credentialId: string
  publicKey: Uint8Array
  counter: number
  transports?: string[]
}

const challengeStore = new Map<string, ChallengeEntry>()
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100"

// ── Challenge store (in-memory, short-lived) ──

function isExpired(entry: ChallengeEntry): boolean {
  return Date.now() > entry.expiresAt
}

function sweepExpired(): void {
  const now = Date.now()
  Array.from(challengeStore.entries()).forEach(([key, entry]) => {
    if (now > entry.expiresAt) {
      challengeStore.delete(key)
    }
  })
}

export function setChallenge(key: string, challenge: string): void {
  challengeStore.set(key, { challenge, expiresAt: Date.now() + CHALLENGE_TTL_MS })
}

export function setTempChallenge(challenge: string): string {
  const key = "tmp-" + crypto.randomUUID()
  challengeStore.set(key, { challenge, expiresAt: Date.now() + CHALLENGE_TTL_MS })
  return key
}

export function getAndVerifyTempChallenge(key: string, challenge: string): boolean {
  const entry = challengeStore.get(key)
  if (!entry) return false
  challengeStore.delete(key)
  if (isExpired(entry)) return false
  if (entry.challenge !== challenge) return false
  return true
}

export function getAndVerifyChallenge(key: string, challenge: string): boolean {
  const entry = challengeStore.get(key)
  if (!entry) return false
  challengeStore.delete(key)
  if (isExpired(entry)) return false
  if (entry.challenge !== challenge) return false
  return true
}

// ── Credential store (persisted in PostgreSQL via Go backend) ──

export async function storeCredential(credentialId: string, record: Omit<CredentialRecord, "credentialId">): Promise<void> {
  const body: Record<string, unknown> = {
    credentialId,
    publicKey: Array.from(record.publicKey),
    counter: record.counter ?? 0,
    transports: record.transports ?? [],
  }
  await fetch(`${API_BASE}/passkey/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export async function getCredential(credentialId: string): Promise<CredentialRecord | undefined> {
  try {
    const res = await fetch(`${API_BASE}/passkey/credentials/${encodeURIComponent(credentialId)}`)
    if (!res.ok) return undefined
    const data = await res.json()
    if (!data?.data) return undefined
    return {
      credentialId: data.data.credentialId,
      publicKey: Uint8Array.from(atob(data.data.publicKey), (c) => c.charCodeAt(0)),
      counter: data.data.counter ?? 0,
      transports: data.data.transports,
    }
  } catch {
    return undefined
  }
}

export function getPepper(): string {
  return process.env.PASSKEY_SERVER_PEPPER || "moistello-passkey-pepper-v1"
}

export function getRpId(): string {
  return process.env.NEXT_PUBLIC_PASSKEY_RP_ID || "localhost"
}

export function getExpectedOrigin(): string {
  return process.env.PASSKEY_EXPECTED_ORIGIN || "http://localhost:1110"
}

sweepExpired()
setInterval(sweepExpired, 60_000)

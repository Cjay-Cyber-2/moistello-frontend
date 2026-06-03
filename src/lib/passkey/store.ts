const CHALLENGE_TTL_MS = 5 * 60 * 1000

interface ChallengeEntry {
  challenge: string
  email: string
  expiresAt: number
}

interface CredentialRecord {
  credentialId: string
  publicKey: Uint8Array
  counter: number
  transports?: string[]
  email?: string
}

const challengeStore = new Map<string, ChallengeEntry>()
const credentialStore = new Map<string, CredentialRecord>()

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

export function setChallenge(key: string, challenge: string, email: string): void {
  challengeStore.set(key, {
    challenge,
    email,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  })
}

export function setTempChallenge(challenge: string): string {
  const key = "tmp-" + crypto.randomUUID()
  challengeStore.set(key, {
    challenge,
    email: "",
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  })
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

export function getAndVerifyChallenge(key: string, challenge: string, email: string): boolean {
  const entry = challengeStore.get(key)
  if (!entry) return false
  challengeStore.delete(key)
  if (isExpired(entry)) return false
  if (entry.challenge !== challenge) return false
  if (email && entry.email && entry.email !== email) return false
  return true
}

export function storeCredential(credentialId: string, record: Omit<CredentialRecord, "credentialId"> & { email?: string }): void {
  credentialStore.set(credentialId, { ...record, credentialId })
}

export function getCredential(credentialId: string): CredentialRecord | undefined {
  return credentialStore.get(credentialId)
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

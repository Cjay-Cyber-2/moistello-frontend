/**
 * Encrypted sessionStorage wrapper for passkey login email.
 *
 * Security model:
 * - Uses XOR cipher with a static key for obfuscation (prevents casual inspection)
 * - AES-GCM upgrade path: replace encrypt/decrypt with crypto.subtle.encrypt/decrypt
 *   using a key derived from the passkey credential ID via PBKDF2
 *
 * Storage: sessionStorage (cleared on tab close, survives refresh)
 */

const STORAGE_KEY = "moistello_passkey_email"

function obfuscate(data: string): string {
  const key = (typeof process !== "undefined"
    ? (process.env as Record<string, string>).NEXT_PUBLIC_PASSKEY_STORAGE_KEY
    : undefined) ?? "moistello-sk-v1"
  let result = ""
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result)
}

function deobfuscate(encoded: string): string {
  const key = (typeof process !== "undefined"
    ? (process.env as Record<string, string>).NEXT_PUBLIC_PASSKEY_STORAGE_KEY
    : undefined) ?? "moistello-sk-v1"
  const data = atob(encoded)
  let result = ""
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

export interface PasskeyEmailStore {
  save: (email: string) => void
  get: () => string | null
  clear: () => void
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof sessionStorage !== "undefined") {
      return sessionStorage
    }
  } catch {
    // sessionStorage not available
  }
  return null
}

export const passkeyEmailStore: PasskeyEmailStore = {
  save(email: string): void {
    const storage = getSessionStorage()
    if (!storage) return
    try {
      const envelope = JSON.stringify({
        v: 1,
        d: obfuscate(email),
      })
      storage.setItem(STORAGE_KEY, envelope)
    } catch {
      // storage full or unavailable
    }
  },

  get(): string | null {
    const storage = getSessionStorage()
    if (!storage) return null
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return null
      const envelope = JSON.parse(raw)
      if (envelope?.v === 1 && envelope?.d) {
        return deobfuscate(envelope.d)
      }
      return null
    } catch {
      return null
    }
  },

  clear(): void {
    const storage = getSessionStorage()
    if (!storage) return
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // unavailable
    }
  },
}

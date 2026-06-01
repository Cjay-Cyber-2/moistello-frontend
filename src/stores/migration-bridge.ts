import { hmac } from "@noble/hashes/hmac.js"
import { sha256 } from "@noble/hashes/sha2.js"
import { bytesToHex } from "@noble/hashes/utils.js"

const OLD_STORAGE_KEY = "moistello_wallet_address"
const NEW_STORAGE_KEY = "moistello_wallet_sessions"
const HMAC_KEY = new TextEncoder().encode("moistello-hmac-v1")

function computeHMAC(data: string): string {
  return bytesToHex(hmac(sha256 as never, HMAC_KEY, new TextEncoder().encode(data)))
}

export function migrateOldWalletSession(): boolean {
  if (typeof window === "undefined") return false
  try {
    const oldAddress = localStorage.getItem(OLD_STORAGE_KEY)
    if (!oldAddress) return false

    const alreadyMigrated = localStorage.getItem(NEW_STORAGE_KEY)
    if (alreadyMigrated) return false

    const sessions = [{
      walletId: "freighter",
      publicKey: oldAddress,
      lastConnected: Date.now(),
      network: "testnet",
    }]
    const serialized = JSON.stringify(sessions)
    const hmac = computeHMAC(serialized)
    const session = {
      sessions,
      hmac,
      activeWalletId: "freighter",
    }
    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(session))
    localStorage.removeItem(OLD_STORAGE_KEY)
    return true
  } catch { return false }
}

import { computeHmacSha256 } from "@/lib/wallet/hmac"

const OLD_STORAGE_KEY = "moistello_wallet_address"
const NEW_STORAGE_KEY = "moistello_wallet_sessions"

export function migrateOldWalletSession(): boolean {
  if (typeof window === "undefined") return false
  try {
    const oldAddress = localStorage.getItem(OLD_STORAGE_KEY)
    if (!oldAddress) return false

    const alreadyMigrated = localStorage.getItem(NEW_STORAGE_KEY)
    if (alreadyMigrated) return false

    const sessions = [
      {
        walletId: "freighter",
        publicKey: oldAddress,
        lastConnected: Date.now(),
        network: "testnet",
      },
    ]
    const serialized = JSON.stringify(sessions)
    const hmac = computeHmacSha256(serialized)
    const session = {
      sessions,
      hmac,
      activeWalletId: "freighter",
    }
    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(session))
    localStorage.removeItem(OLD_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

import { hmac } from "@noble/hashes/hmac.js"
import { sha256 } from "@noble/hashes/sha2.js"
import { bytesToHex, randomBytes } from "@noble/hashes/utils.js"

/**
 * Derive the HMAC key used to protect wallet session integrity.
 *
 * Priority:
 *  1. `NEXT_PUBLIC_WALLET_HMAC_KEY` environment variable — set this to a
 *     cryptographically random hex string (e.g. `openssl rand -hex 32`).
 *  2. A randomly generated key at runtime (per-deployment unique).
 *
 * Security: the env-var path gives reproducible sessions across restarts.
 * The runtime fallback ensures the key is never a well-known string even
 * when the deployer forgets to set the variable.
 */
function getHmacKey(): Uint8Array {
  const fromEnv = process.env.NEXT_PUBLIC_WALLET_HMAC_KEY
  if (fromEnv && fromEnv.length >= 16) {
    return new TextEncoder().encode(fromEnv)
  }
  // Runtime fallback: a random 32-byte key, unique per deployment.
  return randomBytes(32)
}

// Evaluate once at module load so the key stays stable for the lifetime of
// the process, even though the runtime fallback is random.
const HMAC_KEY: Uint8Array = getHmacKey()

export function computeHmacSha256(data: string): string {
  return bytesToHex(hmac(sha256 as never, HMAC_KEY, new TextEncoder().encode(data)))
}

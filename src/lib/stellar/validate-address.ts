import { StrKey } from "@stellar/stellar-base"

/**
 * Validates a Stellar public key (G...) address.
 * Uses @stellar/stellar-base StrKey to verify version byte + CRC-16 checksum.
 */
export function isValidStellarAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false
  if (!address.startsWith("G")) return false
  if (address.length !== 56) return false
  try {
    return StrKey.isValidEd25519PublicKey(address)
  } catch {
    return false
  }
}

/**
 * Validates a Stellar secret key (S...) seed.
 */
export function isValidStellarSecret(seed: string): boolean {
  if (!seed || typeof seed !== "string") return false
  if (!seed.startsWith("S")) return false
  if (seed.length !== 56) return false
  try {
    return StrKey.isValidEd25519SecretSeed(seed)
  } catch {
    return false
  }
}

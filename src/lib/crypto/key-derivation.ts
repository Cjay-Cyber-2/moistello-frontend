import { pbkdf2Async } from "@noble/hashes/pbkdf2.js"
// @ts-expect-error - sha512 is exported at runtime
import { sha256, sha512 } from "@noble/hashes/sha2.js"
import { bytesToHex } from "@noble/hashes/utils.js"

const PBKDF2_ITERATIONS = 100_000

/**
 * Derives an intermediate passkey secret on the client side.
 * This is NOT the final wallet seed — it gets combined with the server-side
 * pepper on the backend to produce the actual Stellar keypair.
 * 
 * The pepper is never exposed to the client bundle.
 */
export async function derivePasskeySecret(credentialId: string): Promise<{
  secretHex: string
  salt: string
}> {
  const saltInput = `v1:${credentialId.slice(0, 16)}`
  const salt = sha256(new TextEncoder().encode(saltInput))
  const credentialBytes = new TextEncoder().encode(credentialId)

  const secret = await pbkdf2Async(
    sha512,
    credentialBytes,
    salt,
    { c: PBKDF2_ITERATIONS, dkLen: 32 }
  )

  return {
    secretHex: bytesToHex(secret),
    salt: saltInput,
  }
}

export function hexEncode(bytes: Uint8Array): string {
  return bytesToHex(bytes)
}

function crc16xmodem(data: Uint8Array): number {
  let crc = 0
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }
  return crc
}

function base32Encode(data: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let result = ""
  let buffer = 0
  let bits = 0
  for (let i = 0; i < data.length; i++) {
    buffer = (buffer << 8) | data[i]
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result += alphabet[(buffer >>> bits) & 0x1f]
    }
  }
  if (bits > 0) {
    result += alphabet[(buffer << (5 - bits)) & 0x1f]
  }
  return result
}

export async function deriveStellarKeypair(
  credentialId: string,
  serverPepper?: string,
): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
  // Server pepper is REQUIRED for production. The fallback is for local dev only.
  const pepper = serverPepper || "moistello-local-dev"
  const passphrase = `${credentialId}:${pepper}`
  const saltInput = `v1:${credentialId.slice(0, 16)}`
  const salt = sha256(new TextEncoder().encode(saltInput))
  const passphraseBytes = new TextEncoder().encode(passphrase)

  const seed = await pbkdf2Async(
    sha512,
    passphraseBytes,
    salt,
    { c: PBKDF2_ITERATIONS, dkLen: 32 }
  )

  const ed = await import("@noble/ed25519") as unknown as { etc: { sha512Sync?: (...msgs: Uint8Array[]) => Uint8Array; concatBytes: (...arrs: Uint8Array[]) => Uint8Array }; getPublicKey: (seed: Uint8Array) => Uint8Array; sign: (msg: Uint8Array, key: Uint8Array) => Uint8Array }
  if (!ed.etc.sha512Sync) {
    const { sha512: sha512Hash } = await import("@noble/hashes/sha2.js") as unknown as { sha512: (...msgs: Uint8Array[]) => Uint8Array }
    ed.etc.sha512Sync = (...msgs: Uint8Array[]) => sha512Hash(ed.etc.concatBytes(...msgs))
  }
  const publicKey = ed.getPublicKey(seed)

  return { publicKey, secretKey: seed }
}

export function publicKeyToStellarAddress(publicKey: Uint8Array): string {
  const versionByte = 0x30
  const payload = new Uint8Array(1 + 32)
  payload[0] = versionByte
  payload.set(publicKey, 1)

  const crc = crc16xmodem(payload)
  const checksum = new Uint8Array([crc & 0xff, (crc >> 8) & 0xff])

  const full = new Uint8Array(35)
  full.set(payload, 0)
  full.set(checksum, 33)

  return base32Encode(full)
}

export function secureZeroMemory(buffer: Uint8Array): void {
  buffer.fill(0)
}

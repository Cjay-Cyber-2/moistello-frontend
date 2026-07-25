import { hmac } from "@noble/hashes/hmac.js"
import { sha256 } from "@noble/hashes/sha2.js"
import { bytesToHex } from "@noble/hashes/utils.js"

const HMAC_KEY = new TextEncoder().encode("moistello-hmac-v1")

export function computeHmacSha256(data: string): string {
  return bytesToHex(hmac(sha256 as never, HMAC_KEY, new TextEncoder().encode(data)))
}

import { NextResponse } from "next/server"
import { randomBytes } from "@noble/hashes/utils.js"
import { bytesToHex } from "@noble/hashes/utils.js"

/**
 * Serves the session HMAC key to the client.
 *
 * If WALLET_HMAC_KEY is set (production), return it verbatim so HMACs are
 * stable across page loads and server restarts.
 *
 * If unset (dev), generate a random key per request so the client still gets
 * a key while being obviously non-deterministic (servers must set the env var
 * for production to avoid invalidating sessions on every cold start).
 */
export async function GET() {
  const fromEnv = process.env.WALLET_HMAC_KEY
  const keyHex = fromEnv && fromEnv.length >= 32
    ? fromEnv
    : bytesToHex(randomBytes(32))

  return NextResponse.json({ keyHex })
}

import { NextRequest, NextResponse } from "next/server"
import { getCredential, getPepper } from "@/lib/passkey/store"
import { checkRateLimit, requireAuthenticatedUser } from "@/lib/passkey/auth-guard"
import { deriveStellarKeypair, hexEncode, signWithSeed, secureZeroMemory } from "@/lib/crypto/key-derivation"

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuthenticatedUser(req)
    if (!auth.ok) {
      return auth.response
    }

    const rateLimit = checkRateLimit(req, "sign-message")
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } })
    }

    const body = await req.json()
    const { credentialId, message } = body

    if (!credentialId || typeof credentialId !== "string") {
      return NextResponse.json({ error: "missing_credential_id" }, { status: 400 })
    }
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "missing_message" }, { status: 400 })
    }

    const storedCredential = await getCredential(credentialId)
    if (!storedCredential) {
      return NextResponse.json({ error: "credential_not_found" }, { status: 400 })
    }
    if (storedCredential.userId !== auth.user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    // The Stellar secret key is derived server-side only for the duration of
    // this signing operation and is zeroed immediately after use — it is
    // never serialized into a response or persisted anywhere.
    const keypair = await deriveStellarKeypair(credentialId, getPepper())
    let signature: Uint8Array
    try {
      const { sha256 } = await import("@noble/hashes/sha2.js")
      const hashBytes = sha256(new TextEncoder().encode(message))
      signature = await signWithSeed(hashBytes, keypair.secretKey)
    } finally {
      secureZeroMemory(keypair.secretKey)
    }

    return NextResponse.json({
      signature: hexEncode(signature),
      publicKey: hexEncode(keypair.publicKey),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("sign-message error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

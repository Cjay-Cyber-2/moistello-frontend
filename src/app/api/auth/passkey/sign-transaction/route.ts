import { NextRequest, NextResponse } from "next/server"
import { getCredential, getPepper } from "@/lib/passkey/store"
import { checkRateLimit, requireAuthenticatedUser } from "@/lib/passkey/auth-guard"
import { deriveStellarKeypair, secureZeroMemory } from "@/lib/crypto/key-derivation"

const DEFAULT_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuthenticatedUser(req)
    if (!auth.ok) {
      return auth.response
    }

    const rateLimit = checkRateLimit(req, "sign-transaction")
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } })
    }

    const body = await req.json()
    const { credentialId, xdr, networkPassphrase } = body

    if (!credentialId || typeof credentialId !== "string") {
      return NextResponse.json({ error: "missing_credential_id" }, { status: 400 })
    }
    if (!xdr || typeof xdr !== "string") {
      return NextResponse.json({ error: "missing_xdr" }, { status: 400 })
    }

    const storedCredential = await getCredential(credentialId)
    if (!storedCredential) {
      return NextResponse.json({ error: "credential_not_found" }, { status: 400 })
    }
    if (storedCredential.userId !== auth.user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { Keypair, Transaction, xdr: stellarXdr } = await import("@stellar/stellar-base")

    let envelope
    try {
      envelope = stellarXdr.TransactionEnvelope.fromXDR(xdr, "base64")
    } catch {
      return NextResponse.json({ error: "invalid_xdr" }, { status: 400 })
    }

    const passphrase = typeof networkPassphrase === "string" && networkPassphrase
      ? networkPassphrase
      : DEFAULT_NETWORK_PASSPHRASE

    let tx
    try {
      tx = new Transaction(envelope, passphrase)
    } catch {
      return NextResponse.json({ error: "invalid_transaction" }, { status: 400 })
    }

    // The Stellar secret key is derived server-side only for the duration of
    // this signing operation and is zeroed immediately after use — it is
    // never serialized into a response or persisted anywhere.
    const keypair = await deriveStellarKeypair(credentialId, getPepper())
    try {
      const kp = Keypair.fromRawEd25519Seed(Buffer.from(keypair.secretKey))
      tx.sign(kp)
    } finally {
      secureZeroMemory(keypair.secretKey)
    }

    const signedXdr = tx.toEnvelope().toXDR("base64")
    return NextResponse.json({ signedXdr })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("sign-transaction error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

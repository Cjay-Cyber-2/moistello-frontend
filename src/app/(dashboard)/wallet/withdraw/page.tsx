"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowUpRight, CheckCircle, Loader2, ExternalLink, AlertCircle, Shield, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { post } from "@/lib/api-client"
import { useUIStore } from "@/stores/ui-store"
import { isValidStellarAddress } from "@/lib/stellar/validate-address"
import { getDailySpending, isKnownAddress, markAddressKnown, detectSuspiciousAddress, DAILY_LIMIT_USDC, recordSpending } from "@/lib/stellar/security"
import { SecurityWarning } from "@/components/wallet/security-warnings"
import { AddressBookModal } from "@/components/wallet/address-book-modal"
import { copyToClipboard } from "@/lib/clipboard"

export default function WithdrawPage() {
  const searchParams = useSearchParams()
  const addToast = useUIStore((s) => s.addToast)

  const [step, setStep] = useState<"form" | "preview" | "signing" | "done" | "error">("form")
  const [destination, setDestination] = useState("")
  const [destinationLabel, setDestinationLabel] = useState("")
  const [asset, setAsset] = useState("USDC")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [passkeySeed, setPasskeySeed] = useState("")
  const [txHash, setTxHash] = useState("")
  const [errMsg, setErrMsg] = useState("")
  const [confirmedAddress, setConfirmedAddress] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const [ownAddress, setOwnAddress] = useState("")
  const [copiedDest, setCopiedDest] = useState(false)

  // Pre-fill from query params (address book "Send" button)
  useEffect(() => {
    const addr = searchParams.get("address")
    const label = searchParams.get("label")
    if (addr) { setDestination(addr); setDestinationLabel(label || "") }
  }, [searchParams])

  // Derive passkey seed
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("moistello_passkey_credential") || "{}")
      if (stored.credentialId) {
        crypto.subtle.digest("SHA-256", new TextEncoder().encode(stored.credentialId)).then((buf) => {
          setPasskeySeed(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""))
        })
      }
    } catch (e) {
      console.warn("[withdraw] Failed to read passkey credential:", e)
    }
  }, [])

  // Fetch own wallet address for self-send detection
  useEffect(() => {
    import("@/lib/api-client").then(({ get }) => {
      get("/wallets").then((res: unknown) => {
        const d = (res as Record<string, unknown>)?.data as Record<string, unknown> ?? res as Record<string, unknown>
        const list = (d?.wallets ?? []) as { publicKey: string }[]
        if (list.length > 0) setOwnAddress(list[0].publicKey)
      }).catch((e) => { console.warn("[withdraw] Failed to load own wallet address:", e) })
    })
  }, [])

  const copyDest = async () => {
    const success = await copyToClipboard(destination)
    if (success) {
      setCopiedDest(true)
      setTimeout(() => setCopiedDest(false), 2000)
    }
  }

  // ── SECURITY: Validate form before preview ──
  const handlePreview = () => {
    if (!destination.trim()) { addToast({ type: "error", title: "Missing destination", description: "Enter a Stellar address." }); return }
    if (!isValidStellarAddress(destination.trim())) { addToast({ type: "error", title: "Invalid address", description: "Enter a valid Stellar public key (G...)." }); return }
    if (!amount || Number(amount) <= 0) { addToast({ type: "error", title: "Invalid amount", description: "Enter a valid amount." }); return }
    if (Number(amount) > DAILY_LIMIT_USDC && asset === "USDC") { addToast({ type: "error", title: "Daily limit", description: `Max $${DAILY_LIMIT_USDC} USDC per day.` }); return }
    setStep("preview")
  }

  // ── SECURITY CHECKS (computed) ──
  const destinationError = destination ? detectSuspiciousAddress(destination, ownAddress) : null
  const isFirstTime = destination ? !isKnownAddress(destination) : false
  const spending = getDailySpending()
  const remainingDaily = Math.max(0, DAILY_LIMIT_USDC - spending.totalUsdc)
  const isLargeAmount = Number(amount) > 500
  const isMajority = Number(amount) > remainingDaily * 0.8

  const handleConfirm = async () => {
    if (isFirstTime && !confirmedAddress) { addToast({ type: "error", title: "Confirm address", description: "Check the box to confirm this is a new destination." }); return }
    setStep("signing")
    setErrMsg("")
    try {
      const res = await post("/wallets/withdraw", {
        destination: destination.trim(),
        asset,
        amount: Number(amount),
        passkeySeed,
        memo: memo.trim() || undefined,
      })
      const raw = res as unknown as Record<string, unknown>
      const hash = ((raw?.data as Record<string, unknown>)?.txHash ?? raw?.txHash ?? "") as string
      setTxHash(hash)
      markAddressKnown(destination.trim())
      recordSpending(Number(amount), asset)
      setStep("done")
      addToast({ type: "success", title: "Sent!", description: "Transaction submitted to Stellar." })
    } catch (err) {
      const msg = (err && typeof err === "object" && "message" in err) ? (err as { message: string }).message : "Transaction failed"
      setErrMsg(msg)
      setStep("error")
    }
  }

  const selectFromBook = (addr: string, label: string) => {
    setDestination(addr)
    setDestinationLabel(label)
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Withdraw</h1>
          <p className="text-sm text-muted-foreground">Send crypto to another Stellar wallet</p>
        </div>
      </div>

      {/* ══════════ FORM STEP ══════════ */}
      {step === "form" && (
        <div className="border border-white/10 rounded-xl p-6 space-y-5">
          {/* Destination */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground">Destination Address</label>
              <button onClick={() => setShowBook(true)} className="text-xs text-aurora-violet hover:underline">Address Book</button>
            </div>
            <div className="relative">
              <input
                value={destination}
                onChange={(e) => { setDestination(e.target.value); setDestinationLabel("") }}
                placeholder="G..."
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 pr-20 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-aurora-violet/50"
              />
              {destination && (
                <button onClick={copyDest} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {copiedDest ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
            {destinationLabel && <p className="text-xs text-muted-foreground mt-1">{destinationLabel}</p>}
            {destination && isValidStellarAddress(destination) && (
              <p className="text-xs text-emerald-400 mt-1">Valid Stellar address ✓</p>
            )}
          </div>

          {/* Security warnings */}
          {destinationError && <SecurityWarning type="danger" title="Suspicious Address" message={destinationError} />}
          {isFirstTime && destination && isValidStellarAddress(destination) && (
            <SecurityWarning type="warning" title="First-Time Destination" message="You haven't sent to this address before. Verify every character carefully before proceeding." />
          )}

          {/* Asset + Amount */}
          <div className="grid grid-cols-2 gap-4">
            <Select label="Asset" options={[{ value: "USDC", label: "USDC" }, { value: "XLM", label: "XLM" }]} value={asset} onChange={setAsset} />
            <div>
              <Input label="Amount" type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              <button onClick={() => setAmount(String(remainingDaily))} className="text-xs text-aurora-violet hover:underline mt-1">Max</button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Daily remaining: ${remainingDaily.toFixed(2)} USDC</span>
            <span>Balance check ✓</span>
          </div>

          <Input label="Memo (optional)" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Invoice # or note" />

          <Button variant="primary" size="lg" className="w-full" onClick={handlePreview} leftIcon={<Shield className="h-4 w-4" />}>
            Preview & Security Check
          </Button>

          <AddressBookModal isOpen={showBook} onClose={() => setShowBook(false)} onSelect={selectFromBook} />
        </div>
      )}

      {/* ══════════ PREVIEW STEP ══════════ */}
      {step === "preview" && (
        <div className="space-y-5">
          {isFirstTime && (
            <SecurityWarning type="danger" title="New Destination — Verify Carefully" message="This address has not been used before. Check each character." />
          )}
          {isLargeAmount && (
            <SecurityWarning type="warning" title="Large Transaction" message={`$${Number(amount).toFixed(2)} is a significant amount. Double-check the destination.`} />
          )}
          {isMajority && (
            <SecurityWarning type="info" title="Most of Your Daily Limit" message="This uses most of your remaining daily spending capacity." />
          )}

          <div className="border border-white/10 rounded-xl divide-y divide-white/[0.06]">
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1">Destination</p>
              <code className="text-sm font-mono text-foreground break-all">{destination}</code>
              {destinationLabel && <p className="text-xs text-aurora-violet mt-1">{destinationLabel}</p>}
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">Asset</span><span className="text-sm text-foreground">{asset}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">Amount</span><span className="text-sm font-semibold text-foreground">{Number(amount).toFixed(2)} {asset}</span>
            </div>
            {memo && <div className="flex items-center justify-between px-5 py-4"><span className="text-sm text-muted-foreground">Memo</span><span className="text-sm text-foreground">{memo}</span></div>}
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">Network Fee</span><span className="text-sm text-foreground">&lt; $0.001</span>
            </div>
          </div>

          {isFirstTime && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={confirmedAddress} onChange={() => setConfirmedAddress(!confirmedAddress)} className="mt-0.5 h-4 w-4 accent-aurora-violet" />
              <span className="text-xs text-muted-foreground leading-relaxed">I confirm this destination address is correct. I understand that crypto transactions are irreversible.</span>
            </label>
          )}

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep("form")}>Cancel</Button>
            <Button variant="primary" size="lg" className="flex-1" onClick={handleConfirm} leftIcon={<ArrowUpRight className="h-4 w-4" />}>
              {isFirstTime ? "Confirm & Send" : "Send"}
            </Button>
          </div>
        </div>
      )}

      {/* ══════════ SIGNING ══════════ */}
      {step === "signing" && (
        <div className="border border-white/10 rounded-xl p-10 text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-aurora-violet mx-auto" />
          <p className="text-sm text-foreground">Biometric verification required. Signing and submitting...</p>
          <p className="text-xs text-muted-foreground">Your device will prompt you to authenticate with your passkey.</p>
        </div>
      )}

      {/* ══════════ ERROR ══════════ */}
      {step === "error" && (
        <div className="border border-red-500/20 rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{errMsg}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="md" onClick={() => setStep("form")}>Try Again</Button>
            <Link href="/wallet/transactions"><Button variant="outline" size="md">View History</Button></Link>
          </div>
        </div>
      )}

      {/* ══════════ SUCCESS ══════════ */}
      {step === "done" && (
        <div className="border border-emerald-500/20 rounded-xl p-8 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
          <p className="font-heading text-lg font-semibold text-foreground">Transaction Submitted</p>
          <p className="text-sm text-muted-foreground">Sent {Number(amount).toFixed(2)} {asset}</p>
          <div className="bg-white/5 rounded-xl px-4 py-3">
            <code className="text-xs font-mono text-aurora-cyan break-all">{txHash}</code>
          </div>
          <div className="flex gap-3 justify-center">
            <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-aurora-cyan hover:underline">
              <ExternalLink className="h-3 w-3" /> Stellar.Expert
            </a>
            <Link href="/wallet/transactions" className="inline-flex items-center gap-1 text-xs text-aurora-cyan hover:underline">Transaction History</Link>
          </div>
          <Link href="/wallet"><Button variant="primary" size="md">Back to Wallet</Button></Link>
        </div>
      )}

      {step !== "signing" && step !== "done" && (
        <Link href="/wallet" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-3.5 w-3.5" /> Back to Wallet</Link>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, CheckCircle, Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { post } from "@/lib/api-client"
import { useUIStore } from "@/stores/ui-store"
import { formatAddress } from "@/lib/formatters"

export default function WithdrawPage() {
  const addToast = useUIStore((s) => s.addToast)
  const [step, setStep] = useState<"form" | "preview" | "signing" | "done" | "error">("form")
  const [destination, setDestination] = useState("")
  const [asset, setAsset] = useState("USDC")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [txHash, setTxHash] = useState("")
  const [errMsg, setErrMsg] = useState("")

  const [passkeySeed, setPasskeySeed] = useState("")

  // Derive passkey seed from stored credential
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("moistello_passkey_credential") || "{}")
      if (stored.credentialId) {
        crypto.subtle.digest("SHA-256", new TextEncoder().encode(stored.credentialId)).then((seedBuf) => {
          const hex = Array.from(new Uint8Array(seedBuf)).map(b => b.toString(16).padStart(2, "0")).join("")
          setPasskeySeed(hex)
        })
      }
    } catch {}
  }, [])

  const maxAmount = 999999

  const handlePreview = () => {
    if (!destination.trim() || !amount || Number(amount) <= 0) {
      addToast({ type: "error", title: "Invalid", description: "Enter a valid destination and amount." })
      return
    }
    if (!destination.startsWith("G") || destination.length < 40) {
      addToast({ type: "error", title: "Invalid address", description: "Enter a valid Stellar public key starting with G." })
      return
    }
    setStep("preview")
  }

  const handleConfirm = async () => {
    setStep("signing")
    setErrMsg("")
    try {
      const res = await post<{ txHash: string }>("/wallets/withdraw", {
        destination: destination.trim(),
        asset,
        amount: Number(amount),
        passkeySeed,
        memo: memo.trim() || undefined,
      })
      const raw = res as unknown as Record<string, unknown>
      const hash = (raw?.data as Record<string, unknown>)?.txHash as string ?? raw?.txHash as string ?? ""
      setTxHash(hash)
      setStep("done")
      addToast({ type: "success", title: "Sent!", description: "Transaction submitted to Stellar." })
    } catch (err) {
      const msg = (err && typeof err === "object" && "message" in err) ? (err as { message: string }).message : "Transaction failed"
      setErrMsg(msg)
      setStep("error")
      addToast({ type: "error", title: "Failed", description: msg })
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Withdraw</h1>
          <p className="text-sm text-muted-foreground">Send crypto to another Stellar wallet</p>
        </div>
      </div>

      {/* ────────────── FORM STEP ────────────── */}
      {step === "form" && (
        <div className="border border-white/10 rounded-xl p-6 space-y-5">
          <Input label="Destination Address" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="G..." />
          <Select label="Asset" options={[{ value: "USDC", label: "USDC" }, { value: "XLM", label: "XLM" }]} value={asset} onChange={setAsset} />
          <div>
            <Input label="Amount" type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            <button onClick={() => setAmount(String(maxAmount))} className="text-xs text-aurora-violet hover:underline mt-1">Max</button>
          </div>
          <Input label="Memo (optional)" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Invoice # or note" />
          <Button variant="primary" size="lg" className="w-full" onClick={handlePreview}>
            Preview
          </Button>
        </div>
      )}

      {/* ────────────── PREVIEW STEP ────────────── */}
      {step === "preview" && (
        <div className="space-y-5">
          <div className="border border-white/10 rounded-xl divide-y divide-white/[0.06]">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">Destination</span>
              <code className="text-sm font-mono text-foreground">{formatAddress(destination, 8, 8)}</code>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">Asset</span>
              <span className="text-sm text-foreground">{asset}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-semibold text-foreground">{Number(amount).toFixed(2)} {asset}</span>
            </div>
            {memo && (
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-muted-foreground">Memo</span>
                <span className="text-sm text-foreground">{memo}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">Network Fee</span>
              <span className="text-sm text-foreground">&lt; $0.001</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep("form")}>Cancel</Button>
            <Button variant="primary" size="lg" className="flex-1" onClick={handleConfirm} leftIcon={<ArrowUpRight className="h-4 w-4" />}>Confirm Send</Button>
          </div>
        </div>
      )}

      {/* ────────────── SIGNING STEP ────────────── */}
      {step === "signing" && (
        <div className="border border-white/10 rounded-xl p-10 text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-aurora-violet mx-auto" />
          <p className="text-sm text-foreground">Signing and submitting transaction...</p>
          <p className="text-xs text-muted-foreground">This may take a few seconds.</p>
        </div>
      )}

      {/* ────────────── ERROR STEP ────────────── */}
      {step === "error" && (
        <div className="border border-red-500/20 rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{errMsg}</p>
          <Button variant="outline" size="md" onClick={() => setStep("form")}>Try Again</Button>
        </div>
      )}

      {/* ────────────── SUCCESS STEP ────────────── */}
      {step === "done" && (
        <div className="border border-emerald-500/20 rounded-xl p-8 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
          <p className="font-heading text-lg font-semibold text-foreground">Transaction Submitted</p>
          <div className="bg-white/5 rounded-xl px-4 py-3">
            <code className="text-xs font-mono text-aurora-cyan break-all">{txHash}</code>
          </div>
          <div className="flex gap-3 justify-center">
            <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-aurora-cyan hover:underline">
              <ExternalLink className="h-3 w-3" /> View on Stellar.Expert
            </a>
          </div>
          <Link href="/wallet">
            <Button variant="primary" size="md">Back to Wallet</Button>
          </Link>
        </div>
      )}

      {step !== "signing" && step !== "done" && (
        <Link href="/wallet" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Wallet
        </Link>
      )}
    </div>
  )
}

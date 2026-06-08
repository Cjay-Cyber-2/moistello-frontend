"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Check, QrCode, ArrowDownCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { get } from "@/lib/api-client"
import { useUIStore } from "@/stores/ui-store"

interface WalletInfo {
  id: string
  publicKey: string
  walletType: string
  createdAt: string
}

export default function DepositPage() {
  const addToast = useUIStore((s) => s.addToast)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSheet, setShowSheet] = useState(true)

  useEffect(() => {
    get("/wallets").then((res) => {
      const d = (res as Record<string, unknown>)?.data as Record<string, unknown> ?? res as Record<string, unknown>
      const list = (d?.wallets ?? []) as WalletInfo[]
      if (list.length > 0) setWallet(list[0])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const copyKey = () => {
    if (!wallet) return
    navigator.clipboard.writeText(wallet.publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    addToast({ type: "info", title: "Copied" })
  }

  const selectAsset = (asset: string) => {
    setSelectedAsset(asset)
    setShowSheet(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Deposit" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        <PageHeader title="Deposit" />
        <p className="text-sm text-muted-foreground">No wallet found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Deposit</h1>
          <p className="text-sm text-muted-foreground">Receive crypto to your wallet</p>
        </div>
      </div>

      {/* Bottom sheet — asset selector */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setShowSheet(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[rgb(var(--background))] border border-white/15 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Asset</span>
              <button onClick={() => setShowSheet(false)} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/10 text-muted-foreground hover:text-foreground text-sm">✕</button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { value: "USDC", label: "USD Coin", desc: "Stablecoin pegged to USD", color: "text-emerald-400" },
                { value: "XLM", label: "Stellar Lumens", desc: "Native Stellar asset", color: "text-aurora-violet" },
              ].map((a) => (
                <button key={a.value} onClick={() => selectAsset(a.value)} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors">
                  <p className={cn("text-sm font-medium", a.color)}>{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deposit address display */}
      <div className="border border-aurora-violet/20 rounded-xl p-6 text-center space-y-5">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-aurora-violet/15 text-aurora-violet">
          <ArrowDownCircle className="h-7 w-7" />
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            Deposit {selectedAsset || "crypto"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Send only {selectedAsset || "crypto"} to this address
          </p>
        </div>

        {/* QR Code placeholder */}
        <div className="inline-flex items-center justify-center w-40 h-40 bg-white rounded-xl mx-auto">
          <QrCode className="h-16 w-16 text-black/80" />
        </div>

        {/* Public key with copy */}
        <div className="bg-white/5 rounded-xl px-4 py-3">
          <code className="text-sm font-mono text-foreground break-all">{wallet.publicKey}</code>
        </div>
        <Button variant="primary" size="md" onClick={copyKey} leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} className="w-full">
          {copied ? "Copied!" : "Copy Address"}
        </Button>
      </div>

      {/* Status monitor placeholder */}
      <div className="border border-white/10 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-aurora-violet" />
          Waiting for incoming transaction...
        </div>
        <p className="text-xs text-muted-foreground">
          Transactions will appear here automatically. You can also check your{" "}
          <Link href="/wallet/transactions" className="text-aurora-violet hover:underline">transaction history</Link>.
        </p>
      </div>

      <Link href="/wallet" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Wallet
      </Link>
    </div>
  )
}

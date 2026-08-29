"use client"

import { Landmark, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/cn"
import { NIGERIAN_BANKS } from "../banks"
import type { WalletOption } from "../types"

interface Props {
  asset: string
  amountUsdc: string
  setAmountUsdc: (v: string) => void
  selectedBank: string
  setSelectedBank: (v: string) => void
  accountNumber: string
  setAccountNumber: (v: string) => void
  accountName: string
  setAccountName: (v: string) => void
  selectedWalletData: WalletOption | undefined
  ngnEstimate: number | null
  loading: boolean
  errMsg: string
  onGetQuote: () => void
  onBack: () => void
}

export function AmountStep({
  asset, amountUsdc, setAmountUsdc,
  selectedBank, setSelectedBank,
  accountNumber, setAccountNumber,
  accountName, setAccountName,
  selectedWalletData, ngnEstimate,
  loading, errMsg, onGetQuote, onBack,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Amount card */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-6">
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Amount to withdraw
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-400">{asset}</span>
            <input
              type="number"
              inputMode="decimal"
              value={amountUsdc}
              onChange={(e) => setAmountUsdc(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="flex-1 bg-transparent text-3xl font-bold font-heading text-foreground border-none outline-none placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          {selectedWalletData && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Available</span>
              <span className="text-foreground">
                {selectedWalletData.balance.toFixed(4)} {asset}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bank details */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="p-5 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Landmark className="h-3.5 w-3.5" />
            Bank Account
          </p>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Bank</label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {NIGERIAN_BANKS.map((b) => (
                <button
                  key={`${b.code}-${b.name}`}
                  onClick={() => setSelectedBank(b.code)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                    selectedBank === b.code
                      ? "bg-aurora-violet/20 border-aurora-violet/40 text-aurora-violet"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/30",
                  )}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-dotted border-white/10" />

          <Input
            label="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="0123456789"
            maxLength={10}
          />

          <div className="border-t border-dotted border-white/10" />

          <Input
            label="Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="John Doe"
          />
        </div>
      </div>

      {/* NGN estimate */}
      {ngnEstimate !== null && (
        <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-5 py-3.5">
          <span className="text-xs text-muted-foreground">You&apos;ll receive approx.</span>
          <span className="text-sm font-semibold text-foreground">
            ₦{ngnEstimate.toLocaleString()}
          </span>
        </div>
      )}

      {errMsg && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errMsg}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={onGetQuote}
          isLoading={loading}
          disabled={!amountUsdc || !selectedBank || !accountNumber || !accountName.trim()}
        >
          Get Quote
        </Button>
      </div>
    </div>
  )
}

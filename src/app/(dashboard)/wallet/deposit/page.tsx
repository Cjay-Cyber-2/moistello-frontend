"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Copy, Banknote } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { post, get } from "@/lib/api-client"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function DepositPage() {
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"form" | "confirm" | "done">("form")
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<{ estimatedUsdc: number; spread: number } | null>(null)
  const [deposit, setDeposit] = useState<{
    paymentRef: string
    bankDetails: { bankName: string; accountNumber: string; accountName: string }
    estimatedUsdc: number
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGetQuote = useCallback(async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setLoading(true)
    try {
      const res = await get<{ quote: { toAmount: number; feePercentage: number } }>(
        `/wallet/deposit/quote?amount=${amt}`
      )
      setQuote({ estimatedUsdc: res.quote.toAmount, spread: res.quote.feePercentage })
      setStep("confirm")
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [amount])

  const handleConfirm = useCallback(async () => {
    setLoading(true)
    try {
      const res = await post<{
        deposit: {
          paymentRef: string
          bankDetails: { bankName: string; accountNumber: string; accountName: string }
          estimatedUsdc: number
        }
      }>("/wallet/deposit", { amountNgn: parseFloat(amount) })
      setDeposit(res.deposit)
      setStep("done")
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [amount])

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const ngnAmount = parseFloat(amount) || 0

  return (
    <div className="space-y-6">
      <PageHeader title="Deposit" description="Add USDC to your wallet via bank transfer." />

      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-lg">
        {step === "form" && (
          <motion.div variants={item} className="glass-premium rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                <Banknote className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">Deposit Naira</h3>
                <p className="text-sm text-muted-foreground">Enter amount in NGN to convert to USDC</p>
              </div>
            </div>
            <Input
              label="Amount (NGN)"
              type="number"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              onClick={handleGetQuote}
              isLoading={loading}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Get Quote
            </Button>
          </motion.div>
        )}

        {step === "confirm" && quote && (
          <motion.div variants={item} className="glass-premium rounded-2xl p-6 space-y-5">
            <h3 className="font-heading text-lg font-semibold">Confirm Deposit</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">You send</span>
                <span className="font-medium">₦{ngnAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">You receive</span>
                <span className="font-medium">{quote.estimatedUsdc.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Fee</span>
                <span className="font-medium text-amber-400">{quote.spread.toFixed(2)}%</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="md" className="flex-1" onClick={() => setStep("form")}>
                Cancel
              </Button>
              <Button variant="premium" size="md" className="flex-1" onClick={handleConfirm} isLoading={loading}>
                Confirm
              </Button>
            </div>
          </motion.div>
        )}

        {step === "done" && deposit && (
          <motion.div variants={item} className="glass-premium rounded-2xl p-6 space-y-5">
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
                <Check className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="font-heading text-lg font-semibold">Deposit Initiated</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Transfer exactly <span className="text-emerald-400 font-semibold">₦{ngnAmount.toLocaleString()}</span> to the account below
              </p>
            </div>

            <div className="glass-whisper rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bank</span>
                <span className="text-sm font-medium">{deposit.bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Account</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold">{deposit.bankDetails.accountNumber}</span>
                  <button onClick={() => handleCopy(deposit.bankDetails.accountNumber)} className="text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Account Name</span>
                <span className="text-sm font-medium">{deposit.bankDetails.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span className="text-sm font-mono text-amber-400">{deposit.paymentRef}</span>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
              USDC will be credited to your wallet automatically once the transfer is detected.
            </div>

            <Link href="/wallet" className="w-full inline-flex items-center justify-center h-12 rounded-xl gradient-bg-extended text-white text-sm font-heading font-bold">
              View Wallet
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

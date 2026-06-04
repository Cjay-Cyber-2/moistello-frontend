"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUp, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { post } from "@/lib/api-client"

const BANKS = [
  { value: "044", label: "Access Bank" },
  { value: "063", label: "Access Bank (Diamond)" },
  { value: "035", label: "ALAT by WEMA" },
  { value: "023", label: "Citibank Nigeria" },
  { value: "063", label: "Diamond Bank" },
  { value: "050", label: "Ecobank Nigeria" },
  { value: "084", label: "Enterprise Bank" },
  { value: "001", label: "First Bank of Nigeria" },
  { value: "214", label: "First City Monument Bank" },
  { value: "070", label: "Fidelity Bank Nigeria" },
  { value: "011", label: "Globus Bank" },
  { value: "058", label: "Guaranty Trust Bank (GTBank)" },
  { value: "030", label: "Heritage Bank" },
  { value: "082", label: "Keystone Bank" },
  { value: "076", label: "Polaris Bank" },
  { value: "002", label: "Providus Bank" },
  { value: "101", label: "Stanbic IBTC Bank" },
  { value: "068", label: "Standard Chartered Bank" },
  { value: "232", label: "Sterling Bank" },
  { value: "071", label: "Suntrust Bank" },
  { value: "069", label: "Titan Trust Bank" },
  { value: "032", label: "Union Bank of Nigeria" },
  { value: "033", label: "United Bank for Africa (UBA)" },
  { value: "215", label: "Unity Bank" },
  { value: "035", label: "Wema Bank" },
  { value: "057", label: "Zenith Bank" },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function WithdrawPage() {
  const [step, setStep] = useState<"form" | "confirm" | "done">("form")
  const [amount, setAmount] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [loading, setLoading] = useState(false)
  const [withdrawResult, setWithdrawResult] = useState<{
    sendId: string
    estimatedNgn: number
    yellowCardAddress: string
    usdcAmount: number
    paymentRef: string
  } | null>(null)

  const handleQuote = useCallback(async () => {
    setStep("confirm")
  }, [])

  const handleConfirm = useCallback(async () => {
    setLoading(true)
    try {
      const res = await post<{
        withdraw: {
          sendId: string
          estimatedNgn: number
          yellowCardAddress: string
          usdcAmount: number
          paymentRef: string
        }
      }>("/wallet/withdraw", {
        amountUsdc: parseFloat(amount),
        bankCode,
        accountNumber,
        accountName,
      })
      setWithdrawResult(res.withdraw)
      setStep("done")
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [amount, bankCode, accountNumber, accountName])

  return (
    <div className="space-y-6">
      <PageHeader title="Withdraw" description="Convert USDC to Naira and send to your bank account." />

      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-lg">
        {step === "form" && (
          <motion.div variants={item} className="glass-premium rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
                <ArrowUp className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">Withdraw to Bank</h3>
                <p className="text-sm text-muted-foreground">Send USDC to your Nigerian bank account</p>
              </div>
            </div>

            <Input
              label="Amount (USDC)"
              type="number"
              placeholder="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select
              label="Bank"
              value={bankCode}
              onChange={(value: string) => setBankCode(value)}
              options={BANKS}
            />
            <Input
              label="Account Number"
              type="text"
              placeholder="0123456789"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            />
            <Input
              label="Account Name"
              type="text"
              placeholder="John Doe"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />

            <Button
              variant="premium"
              size="lg"
              className="w-full"
              onClick={handleQuote}
              disabled={!amount || !bankCode || accountNumber.length < 10 || !accountName}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div variants={item} className="glass-premium rounded-2xl p-6 space-y-5">
            <h3 className="font-heading text-lg font-semibold">Confirm Withdrawal</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">You send</span>
                <span className="font-medium">{parseFloat(amount).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Bank</span>
                <span className="font-medium">{BANKS.find(b => b.value === bankCode)?.label}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Account</span>
                <span className="font-medium">{accountName} / {accountNumber}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You will be prompted to sign a USDC transaction to continue.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="md" className="flex-1" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button variant="premium" size="md" className="flex-1" onClick={handleConfirm} isLoading={loading}>
                Confirm
              </Button>
            </div>
          </motion.div>
        )}

        {step === "done" && withdrawResult && (
          <motion.div variants={item} className="glass-premium rounded-2xl p-6 space-y-5">
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 mb-4">
                <Loader2 className="h-7 w-7 text-amber-400 animate-spin" />
              </div>
              <h3 className="font-heading text-lg font-semibold">Processing Withdrawal</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Send <span className="font-semibold">{withdrawResult.usdcAmount} USDC</span> to the address below
              </p>
            </div>

            <div className="glass-whisper rounded-xl p-4 break-all">
              <p className="text-xs text-muted-foreground mb-1">Yellow Card USDC Address</p>
              <p className="font-mono text-sm">{withdrawResult.yellowCardAddress}</p>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400">
              NGN will be sent to your bank account once Yellow Card receives the USDC. This typically takes a few minutes.
            </div>

            <Link href="/wallet" className="w-full inline-flex items-center justify-center h-12 rounded-xl glass-whisper text-sm font-heading font-bold">
              View Wallet
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

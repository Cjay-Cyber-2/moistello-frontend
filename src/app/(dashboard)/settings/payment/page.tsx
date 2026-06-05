"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  isDefault: boolean
}

const BANKS = [
  { value: "044", label: "Access Bank" },
  { value: "001", label: "First Bank of Nigeria" },
  { value: "058", label: "GTBank" },
  { value: "011", label: "Globus Bank" },
  { value: "070", label: "Fidelity Bank" },
  { value: "032", label: "Union Bank" },
  { value: "033", label: "UBA" },
  { value: "057", label: "Zenith Bank" },
  { value: "050", label: "Ecobank" },
  { value: "214", label: "FCMB" },
  { value: "076", label: "Polaris Bank" },
]

export default function PaymentSettingsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      bankName: "GTBank",
      accountNumber: "0123456789",
      accountName: "John Doe",
      isDefault: true,
    },
  ])
  const [showForm, setShowForm] = useState(false)
  const [currency, setCurrency] = useState("NGN")
  const [adding, setAdding] = useState(false)
  const [bankCode, setBankCode] = useState("")
  const [accNumber, setAccNumber] = useState("")
  const [accName, setAccName] = useState("")

  const handleAddAccount = useCallback(async () => {
    setAdding(true)
    await new Promise((r) => setTimeout(r, 500))
    setAccounts((prev) => [
      ...prev,
      { id: String(Date.now()), bankName: BANKS.find((b) => b.value === bankCode)?.label ?? "", accountNumber: accNumber, accountName: accName, isDefault: prev.length === 0 },
    ])
    setBankCode("")
    setAccNumber("")
    setAccName("")
    setShowForm(false)
    setAdding(false)
  }, [bankCode, accNumber, accName])

  const handleRemove = useCallback(async (id: string) => {
    await new Promise((r) => setTimeout(r, 300))
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const handleSetDefault = useCallback(async (id: string) => {
    setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
  }, [])

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Payment</h1>
          <p className="text-sm text-muted-foreground">Manage your bank accounts for withdrawals</p>
        </div>
      </div>

      {/* Currency Preference */}
      <div className="glass-premium rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-aurora-violet" />
          Currency Preference
        </h3>
        <Select
          label="Preferred Currency"
          options={[
            { value: "NGN", label: "NGN - Nigerian Naira" },
            { value: "USDC", label: "USDC - Stellar USD" },
          ]}
          value={currency}
          onChange={setCurrency}
        />
        <p className="text-xs text-muted-foreground">Your withdrawals will default to this currency.</p>
      </div>

      {/* Saved Bank Accounts */}
      <div className="glass-premium rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-foreground">Bank Accounts</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Bank
          </Button>
        </div>

        {accounts.length === 0 && !showForm && (
          <div className="py-6 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No bank accounts saved yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add one to withdraw USDC to Naira.</p>
          </div>
        )}

        {accounts.map((acc) => (
          <div key={acc.id} className="glass-whisper rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{acc.bankName}</p>
                {acc.isDefault && (
                  <span className="inline-flex h-5 items-center rounded-full bg-aurora-violet/15 px-2 text-[10px] font-medium text-aurora-violet">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{acc.accountNumber}</p>
              <p className="text-xs text-muted-foreground">{acc.accountName}</p>
            </div>
            <div className="flex items-center gap-1">
              {!acc.isDefault && (
                <Button variant="ghost" size="sm" onClick={() => handleSetDefault(acc.id)} className="text-xs h-8">
                  Set Default
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(acc.id)}
                className="text-red-400 h-8"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {showForm && (
          <div className="space-y-4 border-t border-white/[0.06] pt-4">
            <h4 className="text-sm font-medium text-foreground">Add Bank Account</h4>
            <Select
              label="Bank"
              options={BANKS}
              value={bankCode}
              onChange={setBankCode}
              placeholder="Select bank"
            />
            <Input
              label="Account Number"
              value={accNumber}
              onChange={(e) => setAccNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="0123456789"
              maxLength={10}
            />
            <Input
              label="Account Name"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              placeholder="John Doe"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddAccount}
                isLoading={adding}
                disabled={!bankCode || accNumber.length < 10 || !accName}
              >
                Save Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

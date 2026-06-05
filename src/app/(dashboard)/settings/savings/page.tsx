"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  PiggyBank,
  Plus,
  Trash2,
  Target,
  TrendingUp,
  Settings,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/cn"

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  autoContribute: boolean
  roundUps: boolean
}

export default function SavingsSettingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([
    {
      id: "1",
      name: "Emergency Fund",
      targetAmount: 500,
      currentAmount: 150,
      targetDate: "2026-12-31",
      autoContribute: true,
      roundUps: false,
    },
  ])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [autoContribute, setAutoContribute] = useState(true)
  const [roundUps, setRoundUps] = useState(false)
  const [saving, setSaving] = useState(false)
  const [globalAutoContribute, setGlobalAutoContribute] = useState(true)
  const [globalRoundUps, setGlobalRoundUps] = useState(false)

  const handleAddGoal = useCallback(async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    setGoals((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name,
        targetAmount: Number(targetAmount),
        currentAmount: 0,
        targetDate,
        autoContribute,
        roundUps,
      },
    ])
    setName("")
    setTargetAmount("")
    setTargetDate("")
    setAutoContribute(true)
    setRoundUps(false)
    setShowForm(false)
    setSaving(false)
  }, [name, targetAmount, targetDate, autoContribute, roundUps])

  const handleRemoveGoal = useCallback(async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const progress = (current: number, target: number) =>
    target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-sm text-muted-foreground">Track your savings targets and automate contributions</p>
        </div>
      </div>

      <div className="glass-premium rounded-2xl p-6 space-y-5">
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-4 w-4 text-aurora-violet" />
          Global Preferences
        </h3>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Auto-Contribute</p>
            <p className="text-xs text-muted-foreground">Automatically send contributions from your wallet</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={globalAutoContribute}
            onClick={() => setGlobalAutoContribute((v) => !v)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              globalAutoContribute ? "bg-aurora-violet" : "bg-white/10",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                globalAutoContribute ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Round-Ups</p>
            <p className="text-xs text-muted-foreground">Round up transactions to nearest USDC and save the difference</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={globalRoundUps}
            onClick={() => setGlobalRoundUps((v) => !v)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              globalRoundUps ? "bg-aurora-violet" : "bg-white/10",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                globalRoundUps ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </div>

      <div className="glass-premium rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-aurora-violet" />
            Your Goals
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Goal
          </Button>
        </div>

        {goals.length === 0 && !showForm && (
          <div className="py-6 text-center">
            <PiggyBank className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No savings goals yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Set your first savings goal to get started.</p>
          </div>
        )}

        {goals.map((goal) => {
          const pct = progress(goal.currentAmount, goal.targetAmount)
          return (
            <div key={goal.id} className="glass-whisper rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aurora-violet/15 text-aurora-violet">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveGoal(goal.id)}
                  className="text-red-400 h-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-aurora-violet to-aurora-indigo rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{pct}% complete</span>
                {goal.autoContribute && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="h-3 w-3" /> Auto
                  </span>
                )}
                {goal.targetDate && (
                  <span>
                    Due {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {showForm && (
          <div className="space-y-4 border-t border-white/[0.06] pt-4">
            <h4 className="text-sm font-medium text-foreground">New Savings Goal</h4>
            <Input
              label="Goal Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund"
            />
            <Input
              label="Target Amount (USDC)"
              type="number"
              min={1}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="500"
            />
            <Input
              label="Target Date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Auto-contribute to this goal</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoContribute}
                onClick={() => setAutoContribute((v) => !v)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                  autoContribute ? "bg-aurora-violet" : "bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                    autoContribute ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Enable round-ups</span>
              <button
                type="button"
                role="switch"
                aria-checked={roundUps}
                onClick={() => setRoundUps((v) => !v)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                  roundUps ? "bg-aurora-violet" : "bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                    roundUps ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddGoal}
                isLoading={saving}
                disabled={!name || !targetAmount}
              >
                Create Goal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

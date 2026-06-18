"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, PiggyBank, Plus, Trash2, Target, Check, X, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { cn } from "@/lib/cn"
import { useTranslate } from "@/lib/locale/context"
import { get, post, patch, del } from "@/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface SavingsGoal {
  id: string
  name: string
  description: string
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  circleId: string | null
  autoReserve: boolean
  status: string
  createdAt: string
}

interface GoalSummary {
  totalGoals: number
  activeGoals: number
  completedGoals: number
  totalTarget: number
  totalSaved: number
  overallPercent: number
  savingsStreak: number
}

function CircularProgress({ percent, size = 80 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  const color = percent >= 100 ? "#22c55e" : percent >= 50 ? "#a78bfa" : "#818cf8"
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-foreground font-heading font-bold" fontSize={size * 0.18}>
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function SavingsPage() {
  const { t } = useTranslate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const res = await get<{ goals?: SavingsGoal[] }>("/savings/goals")
      return (res as Record<string, unknown>)?.goals as SavingsGoal[] ?? []
    },
  })

  const { data: summary } = useQuery({
    queryKey: ["savings-summary"],
    queryFn: async () => {
      const res = await get<{ summary?: GoalSummary }>("/savings/goals/summary")
      return (res as Record<string, unknown>)?.summary as GoalSummary ?? null
    },
  })

  const filtered = goals.filter((g) => {
    if (filter === "active") return g.status === "active"
    if (filter === "completed") return g.status === "completed"
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1
    if (a.status !== "active" && b.status === "active") return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => post("/savings/goals", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["savings-goals"] }); queryClient.invalidateQueries({ queryKey: ["savings-summary"] }); setShowCreate(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => patch(`/savings/goals/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["savings-goals"] }); queryClient.invalidateQueries({ queryKey: ["savings-summary"] }); setEditingGoal(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => del(`/savings/goals/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["savings-goals"] }); queryClient.invalidateQueries({ queryKey: ["savings-summary"] }); setDeleteTarget(null) },
  })

  const completeMutation = useMutation({
    mutationFn: async (id: string) => post(`/savings/goals/${id}/complete`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["savings-goals"] }); queryClient.invalidateQueries({ queryKey: ["savings-summary"] }) },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">{t("savings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("savings.subtitle")}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-premium rounded-2xl p-4 flex flex-col items-center gap-1.5">
          <p className="text-2xs text-muted-foreground uppercase tracking-wider">{t("savings.totalSaved")}</p>
          <p className="font-heading text-xl font-bold gradient-text">{summary ? formatCurrency(summary.totalSaved) : "$0"}</p>
        </div>
        <div className="glass-premium rounded-2xl p-4 flex flex-col items-center gap-1.5">
          <p className="text-2xs text-muted-foreground uppercase tracking-wider">{t("savings.totalTarget")}</p>
          <p className="font-heading text-xl font-bold text-foreground">{summary ? formatCurrency(summary.totalTarget) : "$0"}</p>
        </div>
        <div className="glass-premium rounded-2xl p-4 flex flex-col items-center gap-1.5">
          <p className="text-2xs text-muted-foreground uppercase tracking-wider">{t("savings.active")}</p>
          <p className="font-heading text-xl font-bold text-foreground">{summary?.activeGoals ?? 0}</p>
        </div>
        <div className="glass-premium rounded-2xl p-4 flex flex-col items-center gap-1.5">
          <p className="text-2xs text-muted-foreground uppercase tracking-wider">{t("savings.completed")}</p>
          <p className="font-heading text-xl font-bold text-emerald-400">{summary?.completedGoals ?? 0}</p>
        </div>
      </div>

      {/* Overall Progress Ring */}
      {summary && summary.totalTarget > 0 && (
        <div className="glass-premium rounded-2xl p-5 flex items-center gap-6">
          <CircularProgress percent={summary.overallPercent} size={96} />
          <div className="flex-1 min-w-0">
            <p className="font-heading text-sm font-semibold text-foreground">{t("savings.overallProgress")}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(summary.totalSaved)} / {formatCurrency(summary.totalTarget)}</p>
            <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-aurora-violet to-aurora-indigo rounded-full transition-all duration-700"
                style={{ width: `${Math.min(summary.overallPercent, 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Filter + Create */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "active", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === f ? "bg-aurora-violet/20 text-aurora-violet" : "text-muted-foreground hover:text-foreground")}>
              {f === "all" ? t("savings.all") : f === "active" ? t("savings.active") : t("savings.completed")}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
          {t("savings.createGoal")}
        </Button>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass-premium rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-32 bg-white/5 rounded mb-3" />
              <div className="h-8 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-premium rounded-2xl p-10 text-center">
          <PiggyBank className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-heading text-base font-semibold text-foreground">{t("savings.noGoals")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("savings.noGoalsHint")}</p>
          <Button variant="primary" size="md" className="mt-4" onClick={() => setShowCreate(true)}>
            {t("savings.createGoal")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
            const isCompleted = goal.status === "completed"
            return (
              <div key={goal.id} className={cn("glass-premium rounded-2xl p-5 space-y-4 transition-all hover:glass-strong",
                isCompleted && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CircularProgress percent={pct} size={56} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-sm font-semibold text-foreground truncate">{goal.name}</p>
                        {isCompleted && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      {goal.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{goal.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!isCompleted && (
                      <button onClick={() => setEditingGoal(goal)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                        <Target className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDeleteTarget(goal)} className="p-1.5 rounded-lg hover:bg-white/5 text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700",
                      isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-aurora-violet to-aurora-indigo")}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
                  {goal.targetDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {t("savings.dueDate")}: {formatDate(goal.targetDate)}
                    </span>
                  )}
                  {goal.autoReserve && (
                    <span className="inline-flex items-center gap-1 text-aurora-violet">
                      <AlertCircle className="h-3 w-3" /> {t("savings.autoReserve")}
                    </span>
                  )}
                </div>

                {/* Complete button */}
                {!isCompleted && pct >= 100 && (
                  <Button variant="primary" size="xs" onClick={() => completeMutation.mutate(goal.id)}
                    isLoading={completeMutation.isPending} className="w-full text-xs h-8">
                    <Check className="h-3.5 w-3.5 mr-1" /> {t("savings.completeGoal")}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreate || editingGoal) && (
        <GoalFormModal
          goal={editingGoal}
          onClose={() => { setShowCreate(false); setEditingGoal(null) }}
          onSave={(data) => {
            if (editingGoal) updateMutation.mutate({ id: editingGoal.id, ...data })
            else createMutation.mutate(data)
          }}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id) }}
        title={t("savings.deleteGoal")}
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={t("savings.deleteGoal")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function GoalFormModal({ goal, onClose, onSave, saving }: {
  goal: SavingsGoal | null
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  saving: boolean
}) {
  const { t } = useTranslate()
  const [name, setName] = useState(goal?.name ?? "")
  const [description, setDescription] = useState(goal?.description ?? "")
  const [targetAmount, setTargetAmount] = useState(String(goal?.targetAmount ?? ""))
  const [currentAmount, setCurrentAmount] = useState(String(goal?.currentAmount ?? "0"))
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "")
  const [autoReserve, setAutoReserve] = useState(goal?.autoReserve ?? false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      description,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      targetDate: targetDate || null,
      autoReserve,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-premium rounded-2xl p-6 w-full max-w-md mx-4 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">{goal ? t("savings.editGoal") : t("savings.newGoal")}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("savings.goalName")} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("savings.goalNamePlaceholder")} required />
          <Input label={t("savings.description")} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("savings.descriptionPlaceholder")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("savings.targetAmount")} type="number" min={1} value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="500" required />
            <Input label={t("savings.currentAmount")} type="number" min={0} value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0" />
          </div>
          <Input label={t("savings.targetDate")} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />

          {/* Auto-reserve toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{t("savings.autoReserve")}</p>
              <p className="text-xs text-muted-foreground">{t("savings.autoReserveHint")}</p>
            </div>
            <button type="button" role="switch" aria-checked={autoReserve}
              onClick={() => setAutoReserve((v) => !v)}
              className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                autoReserve ? "bg-aurora-violet" : "bg-white/10")}>
              <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                autoReserve ? "translate-x-4" : "translate-x-0")} />
            </button>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="md" type="button" onClick={onClose}>{t("savings.cancel")}</Button>
            <Button variant="primary" size="md" type="submit" isLoading={saving} disabled={!name || !targetAmount}>
              {goal ? t("savings.save") : t("savings.createGoal")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

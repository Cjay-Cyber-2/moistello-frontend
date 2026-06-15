"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  CircleDot,
  ArrowUpCircle,
  ArrowDownCircle,
  Award,
  Users,
  Plus,
  Clock,
  Shield,
  Inbox,
} from "lucide-react"
import { get } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import { useTranslate } from "@/lib/locale/context"
import type { ApiResponse, Circle, Contribution, Payout } from "@/types"

function StatCard({ label, value, icon, gradient, pulseGlow }: { label: string; value: string; icon: React.ReactNode; gradient: string; pulseGlow?: boolean }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body">{label}</p>
          <p className="font-heading text-2xl font-bold gradient-text">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br", gradient, pulseGlow && "animate-pulse-glow")}>
          <span className="text-white">{icon}</span>
        </div>
      </div>
    </div>
  )
}

function CircleCard({ circle }: { circle: Circle }) {
  const { t } = useTranslate()
  const freqLabel = circle.frequency.charAt(0).toUpperCase() + circle.frequency.slice(1)
  const memberCount = circle.memberCount ?? 0
  const progressPct = Math.min(100, Math.round((circle.currentRound / (circle.maxMembers || 1)) * 100))
  return (
    <Link href={`/circles/${circle.id}`}>
      <div className="glass rounded-2xl p-5 holo-border">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-heading text-lg font-semibold text-foreground truncate">{circle.name}</h4>
          <Badge variant={circle.status === "active" ? "success" : circle.status === "pending" ? "warning" : "default"} size="sm">
            {t("circles." + circle.status)}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm text-muted-foreground">
          <span className="gradient-text font-bold font-heading">{formatCurrency(circle.contributionAmount, circle.currency)}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{memberCount}/{circle.maxMembers}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{freqLabel}</span>
          {circle.minMoiScore != null && circle.minMoiScore > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-400 text-xs"><Shield className="h-3 w-3" />{circle.minMoiScore}+</span>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-2xs text-muted-foreground">
            <span>{t("dash.roundProgress")}</span>
            <span>{circle.currentRound}/{circle.maxMembers}</span>
          </div>
          <Progress value={progressPct} size="sm" variant={progressPct >= 80 ? "success" : "primary"} />
        </div>
      </div>
    </Link>
  )
}

function CreateCircleCard() {
  const { t } = useTranslate()
  return (
    <Link href="/circles/create">
      <div className="glass-whisper rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[160px] holo-border border-dashed">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet/20 to-aurora-cyan/20 text-aurora-violet mb-3">
          <Plus className="h-6 w-6" />
        </div>
        <p className="font-heading text-sm font-semibold text-foreground">{t("dash.startCircle")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("dash.createCircleDesc")}</p>
      </div>
    </Link>
  )
}

function ActivityTimelineItem({ description, amount, date, type }: { description: string; amount: string; date: string; type?: "contribution" | "payout" }) {
  const iconColor = type === "payout"
    ? "from-emerald-500/20 to-aurora-cyan/20 text-emerald-400"
    : "from-aurora-indigo/20 to-aurora-violet/20 text-aurora-violet"
  return (
    <div className="glass-whisper rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br", iconColor)}>
          {type === "payout" ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-foreground truncate font-body">{description}</p>
          <p className="text-2xs text-muted-foreground">{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        </div>
      </div>
      <span className="gradient-text text-sm font-bold font-heading shrink-0 ml-3">{amount}</span>
    </div>
  )
}

export default function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth()
  const { t } = useTranslate()

  const { data: circlesData, isLoading: circlesLoading } = useQuery({
    queryKey: ["my-circles"],
    queryFn: async () => {
      const res = await get<ApiResponse<{ circles: Circle[] }>>("/users/me/circles")
      return res.data?.circles ?? []
    },
  })

  const { data: contribsData, isLoading: contribsLoading } = useQuery({
    queryKey: ["contributions", "dashboard"],
    queryFn: async () => {
      const res = await get<ApiResponse<{ contributions: Contribution[] }>>("/contributions?limit=20&page=1")
      return res.data?.contributions ?? []
    },
  })

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ["payouts", "dashboard"],
    queryFn: async () => {
      const res = await get<ApiResponse<{ payouts: Payout[] }>>("/payouts?limit=20&page=1")
      return res.data?.payouts ?? []
    },
  })

  const circles = useMemo(() => circlesData ?? [], [circlesData])
  const contributions = useMemo(() => contribsData ?? [], [contribsData])
  const payouts = useMemo(() => payoutsData ?? [], [payoutsData])

  const isLoading = authLoading || circlesLoading || contribsLoading || payoutsLoading

  const stats = useMemo(() => {
    const activeCircles = circles.filter((c) => c.status === "active").length
    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0)
    const totalReceived = payouts.reduce((sum, p) => sum + p.amount, 0)
    return {
      activeCircles,
      totalContributed: formatCurrency(totalContributed, "USDC"),
      totalReceived: formatCurrency(totalReceived, "USDC"),
      moiScore: String(user?.moiScore ?? 0),
    }
  }, [circles, contributions, payouts, user])

  const moiHighScore = (user?.moiScore ?? 0) >= 600

  const recentActivity = useMemo(() => {
    const items: { id: string; description: string; amount: string; date: string; type: "contribution" | "payout" }[] = []
    for (const c of contributions) {
      items.push({ id: `c-${c.id}`, description: `Contribution in round ${c.roundNumber}`, amount: formatCurrency(c.amount, "USDC"), date: c.submittedAt, type: "contribution" })
    }
    for (const p of payouts) {
      items.push({ id: `p-${p.id}`, description: `Payout received — round ${p.roundNumber}`, amount: formatCurrency(p.amount, "USDC"), date: p.executedAt, type: "payout" })
    }
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return items.slice(0, 5)
  }, [contributions, payouts])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title={t("dash.title")} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} variant="card" className="h-24 rounded-2xl" />))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton variant="heading" className="rounded-xl h-6 w-36" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} variant="card" className="h-40 rounded-2xl" />))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton variant="heading" className="rounded-xl h-6 w-40" />
            <Skeleton variant="card" className="h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t("dash.title")} description={t("dash.welcome")} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t("dash.activeCircles")} value={String(stats.activeCircles)} icon={<CircleDot className="h-5 w-5" />} gradient="from-aurora-indigo to-aurora-violet" />
        <StatCard label={t("dash.totalContributed")} value={stats.totalContributed} icon={<ArrowUpCircle className="h-5 w-5" />} gradient="from-aurora-cyan to-aurora-indigo" />
        <StatCard label={t("dash.totalReceived")} value={stats.totalReceived} icon={<ArrowDownCircle className="h-5 w-5" />} gradient="from-emerald-500 to-aurora-cyan" />
        <StatCard label={t("dash.moiScore")} value={stats.moiScore} icon={<Award className="h-5 w-5" />} gradient="from-aurora-amber to-aurora-violet" pulseGlow={moiHighScore} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-foreground">{t("dash.yourCircles")}</h3>
            <Link href="/circles" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">{t("dash.browseAll")} &rarr;</Link>
          </div>
          {circles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {circles.slice(0, 4).map((circle) => (<CircleCard key={circle.id} circle={circle} />))}
              <CreateCircleCard />
            </div>
          ) : (
            <EmptyState icon={<Users className="h-6 w-6" />} title={t("dash.noCircles")} description={t("dash.noCirclesDesc")} action={{ label: t("dash.createCircle"), onClick: () => { window.location.href = "/circles/create" } }} />
          )}
        </div>
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">{t("dash.recentActivity")}</h3>
          {recentActivity.length > 0 ? (
            <div className="glass rounded-2xl p-5 holo-border">
              <div className="space-y-3">{recentActivity.map((item) => (<ActivityTimelineItem key={item.id} description={item.description} amount={item.amount} date={item.date} type={item.type} />))}</div>
            </div>
          ) : (
            <EmptyState icon={<Inbox className="h-6 w-6" />} title={t("dash.noActivity")} description={t("dash.noActivityDesc")} />
          )}
        </div>
      </div>
    </div>
  )
}

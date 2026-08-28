"use client"

import { useState } from "react"
import { Check, Copy, Share2, Users, UserCheck, CircleDot, DollarSign } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"

interface ReferralData {
  code: string
  clicks: number
  signups: number
  completedCircles: number
  bonusAmount: number
  bonuses: Array<{ id: string; description: string; amount: number; createdAt: string }>
}

function useReferralData() {
  return useQuery({
    queryKey: ["referrals-me"],
    queryFn: async (): Promise<ReferralData> => {
      const result = await get<{ referral?: ReferralData } | ReferralData>("/referrals/me")
      if ("referral" in result && result.referral) return result.referral
      return result as ReferralData
    },
  })
}

function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm">
      <Icon className="h-4 w-4 text-aurora-violet" />
      <strong className="text-foreground">{value}</strong>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

function BonusRow({ bonus }: { bonus: ReferralData["bonuses"][number] }) {
  return (
    <tr className="border-t border-white/5">
      <td className="py-4 text-sm text-foreground">{bonus.description}</td>
      <td className="py-4 text-sm text-muted-foreground">{new Date(bonus.createdAt).toLocaleDateString()}</td>
      <td className="py-4 text-right font-mono text-sm text-emerald-400">${bonus.amount.toFixed(2)}</td>
    </tr>
  )
}

export default function ReferralsPage() {
  const { data, isLoading, error } = useReferralData()
  const [copied, setCopied] = useState(false)

  const referralUrl = data
    ? typeof window === "undefined"
      ? `/register?ref=${data.code}`
      : `${window.location.origin}/register?ref=${data.code}`
    : ""

  const handleCopy = async () => {
    if (!referralUrl) return
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Join Moistello", url: referralUrl }).catch(() => {})
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-24 bg-white/5 rounded-lg" />
          <div className="h-32 bg-white/5 rounded-lg" />
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-white/5 rounded-full" />
            <div className="h-10 w-24 bg-white/5 rounded-full" />
            <div className="h-10 w-24 bg-white/5 rounded-full" />
            <div className="h-10 w-24 bg-white/5 rounded-full" />
          </div>
          <div className="h-48 bg-white/5 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-6 text-center">
          <p className="text-sm text-red-400">{error ? "Referral activity could not be loaded." : "No referral data available."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with decorative element */}
      <div className="relative mb-8">
        <div className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full bg-aurora-violet/8 blur-2xl" />
        <div className="border-l-4 border-l-emerald-400 pl-5">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Growth incentive program</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-foreground">Referral dashboard</h1>
        </div>
      </div>

      {/* Referral code section - full-bleed gradient */}
      <section className="bg-gradient-to-r from-aurora-violet/12 via-transparent to-aurora-cyan/8 px-6 py-7 mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Your referral code</p>
        <div className="flex flex-wrap items-center gap-4">
          <code className="font-mono text-3xl font-bold text-foreground tracking-wider">{data.code}</code>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:border-aurora-violet/40 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:border-aurora-violet/40 transition-colors"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          )}
        </div>
      </section>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-3 mb-10">
        <StatPill icon={Users} value={data.clicks} label="Clicks" />
        <StatPill icon={UserCheck} value={data.signups} label="Signups" />
        <StatPill icon={CircleDot} value={data.completedCircles} label="Completed circles" />
        <StatPill icon={DollarSign} value={`$${data.bonusAmount.toFixed(2)}`} label="Bonus earned" />
      </div>

      {/* Bonus history */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Bonus history</h2>
        {data.bonuses.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">No bonuses earned yet. Share your referral code to get started!</p>
          </div>
        ) : (
          <div className="border-y border-white/10 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 font-medium">Activity</th>
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 font-medium text-right">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {data.bonuses.map((bonus) => (
                  <BonusRow key={bonus.id} bonus={bonus} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

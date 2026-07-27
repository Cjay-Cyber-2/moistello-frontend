"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Share2 } from "lucide-react"
import { get } from "@/lib/api-client"

interface ReferralData {
  code: string
  clicks: number
  signups: number
  completedCircles: number
  bonusAmount: number
  bonuses: Array<{ id: string; description: string; amount: number; createdAt: string }>
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    void get<{ referral?: ReferralData } | ReferralData>("/referrals/me")
      .then((result) => setData("referral" in result && result.referral ? result.referral : result as ReferralData))
      .catch(() => setError("Referral activity could not be loaded."))
  }, [])

  if (!data) return <p className="py-16 text-muted-foreground">{error || "Loading referrals…"}</p>
  const referralUrl =
    typeof window === "undefined"
      ? `/register?ref=${data.code}`
      : `${window.location.origin}/register?ref=${data.code}`

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -right-10 top-10 h-44 w-44 rounded-full bg-aurora-violet/10 blur-3xl" />
      <header className="border-b border-dotted border-white/20 pb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Growth incentive program</p>
        <h1 className="mt-3 font-heading text-4xl font-bold">Referral dashboard</h1>
      </header>

      <section className="mt-10 bg-gradient-to-r from-aurora-violet/15 to-transparent px-6 py-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your referral code</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <code className="font-mono text-4xl font-bold text-foreground">{data.code}</code>
          <button onClick={() => void navigator.clipboard.writeText(referralUrl).then(() => setCopied(true))} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} Copy link
          </button>
          <button onClick={() => void navigator.share?.({ title: "Join Moistello", url: referralUrl })} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {[["Clicks", data.clicks], ["Signups", data.signups], ["Completed circles", data.completedCircles], ["Bonus", `$${data.bonusAmount.toFixed(2)}`]].map(([label, value]) => (
          <span key={label} className="rounded-full border border-white/10 px-5 py-3 text-sm"><strong className="mr-2 text-foreground">{value}</strong>{label}</span>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-2xl">Bonus history</h2>
        <div className="mt-5 overflow-x-auto border-y border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="py-3">Activity</th><th>Date</th><th className="text-right">Bonus</th></tr></thead>
            <tbody>{data.bonuses.map((bonus) => <tr key={bonus.id} className="border-t border-white/5"><td className="py-4">{bonus.description}</td><td className="text-muted-foreground">{new Date(bonus.createdAt).toLocaleDateString()}</td><td className="text-right font-mono text-emerald-400">${bonus.amount.toFixed(2)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

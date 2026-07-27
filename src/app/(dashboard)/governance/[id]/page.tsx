"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ThumbsDown, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getProposal, voteOnProposal, type GovernanceProposal } from "@/lib/governance-api"

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [proposal, setProposal] = useState<GovernanceProposal | null>(null)
  const [message, setMessage] = useState("")

  const load = () =>
    void getProposal(id)
      .then(setProposal)
      .catch(() => setMessage("Proposal could not be loaded."))

  useEffect(() => {
    void getProposal(id)
      .then(setProposal)
      .catch(() => setMessage("Proposal could not be loaded."))
  }, [id])

  const total = (proposal?.votesFor ?? 0) + (proposal?.votesAgainst ?? 0)
  const forPercent = total ? Math.round(((proposal?.votesFor ?? 0) / total) * 100) : 0
  const countdown = useMemo(() => {
    if (!proposal?.timelockEndsAt) return "No timelock"
    const hours = Math.max(0, Math.ceil((new Date(proposal.timelockEndsAt).getTime() - Date.now()) / 3_600_000))
    return `${hours}h remaining`
  }, [proposal?.timelockEndsAt])

  async function vote(support: boolean) {
    setMessage("")
    try {
      await voteOnProposal(id, support)
      setMessage("Vote submitted to the governance contract.")
      load()
    } catch {
      setMessage("The vote could not be submitted. Check your wallet and retry.")
    }
  }

  if (!proposal) return <p className="py-16 text-muted-foreground">{message || "Loading proposal…"}</p>

  return (
    <div>
      <Link href="/governance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All proposals
      </Link>
      <section className="relative mt-6 overflow-hidden bg-gradient-to-r from-aurora-violet/20 via-transparent to-emerald-400/10 px-6 py-12">
        <div className="absolute right-6 top-4 font-mono text-6xl text-white/5">#{proposal.id}</div>
        <span className="rounded-full border border-aurora-violet/40 px-3 py-1 text-xs uppercase text-aurora-violet">{proposal.status}</span>
        <h1 className="mt-5 max-w-3xl font-heading text-4xl font-bold text-foreground">{proposal.title}</h1>
        <p className="mt-5 max-w-3xl whitespace-pre-wrap text-muted-foreground">{proposal.description}</p>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <section>
          <div className="flex justify-between text-sm"><span>For {proposal.votesFor}</span><span>Against {proposal.votesAgainst}</span></div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-red-400/20">
            <div className="h-full bg-emerald-400" style={{ width: `${forPercent}%` }} />
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => void vote(true)} leftIcon={<ThumbsUp className="h-4 w-4" />}>Vote for</Button>
            <Button variant="destructive" onClick={() => void vote(false)} leftIcon={<ThumbsDown className="h-4 w-4" />}>Vote against</Button>
          </div>
          {message && <p role="status" className="mt-4 text-sm text-amber-400">{message}</p>}
        </section>
        <aside className="border-l-4 border-l-amber-400 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Timelock</p>
          <p className="mt-2 font-mono text-2xl text-foreground">{countdown}</p>
          <p className="mt-2 text-xs text-muted-foreground">Passed proposals execute only after this safety window.</p>
        </aside>
      </div>
    </div>
  )
}

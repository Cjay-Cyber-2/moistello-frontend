"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Landmark, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  listProposals,
  type GovernanceProposal,
  type ProposalStatus,
} from "@/lib/governance-api"

const tabs: ProposalStatus[] = ["active", "passed", "defeated"]

export default function GovernancePage() {
  const [status, setStatus] = useState<ProposalStatus>("active")
  const [proposals, setProposals] = useState<GovernanceProposal[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    setError("")
    void listProposals(status).then(setProposals).catch(() => {
      setError("Governance proposals could not be loaded. Try again.")
    })
  }, [status])

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-8 top-4 text-[11rem] font-heading font-black leading-none text-aurora-violet/5">
        GOV
      </div>
      <header className="relative border-l-4 border-l-aurora-violet py-3 pl-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-aurora-violet">
          Community control
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-bold text-foreground">Governance</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Propose and vote on changes executed through the governance contract.
            </p>
          </div>
          <Link href="/governance/create">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Create proposal</Button>
          </Link>
        </div>
      </header>

      <nav className="mt-10 flex gap-8 border-b border-white/10" aria-label="Proposal status">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`relative pb-3 text-sm capitalize ${
              status === tab ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {tab}
            {status === tab && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-aurora-violet" />
            )}
          </button>
        ))}
      </nav>

      {error && <p role="alert" className="mt-8 text-red-400">{error}</p>}
      <ol className="relative mt-8 space-y-8 border-l border-dashed border-aurora-violet/40 pl-8">
        {proposals.map((proposal, index) => (
          <li key={proposal.id} className="relative">
            <span className="absolute -left-[2.55rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-aurora-violet font-mono text-[10px] text-white">
              {index + 1}
            </span>
            <Link href={`/governance/${proposal.id}`} className="group block">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {proposal.status}
                  </span>
                  <h2 className="mt-3 font-heading text-xl text-foreground group-hover:text-aurora-violet">
                    {proposal.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {proposal.description}
                  </p>
                </div>
                <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-aurora-violet" />
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {!error && proposals.length === 0 && (
        <div className="mt-12 flex items-center gap-4 border-y border-white/10 py-8 text-muted-foreground">
          <Landmark className="h-8 w-8 text-aurora-violet" />
          No {status} proposals yet.
        </div>
      )}
    </div>
  )
}

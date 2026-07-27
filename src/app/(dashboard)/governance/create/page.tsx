"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileCode2, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createProposal } from "@/lib/governance-api"

export default function CreateProposalPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [executionPayload, setExecutionPayload] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const proposal = await createProposal({ title, description, executionPayload })
      router.push(`/governance/${proposal.id}`)
    } catch {
      setError("Proposal could not be submitted to the governance contract.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-10 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <li className="text-aurora-violet">1. Describe</li><li>—</li><li>2. Review</li><li>—</li><li>3. On-chain</li>
      </ol>
      <header>
        <p className="font-mono text-xs text-aurora-violet">NEW GOVERNANCE ACTION</p>
        <h1 className="mt-2 font-heading text-4xl font-bold">Create proposal</h1>
      </header>
      <form className="mt-10 space-y-8" onSubmit={(event) => { event.preventDefault(); void submit() }}>
        <div className="border-l-4 border-l-aurora-violet pl-5"><Input label="Proposal title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <label className="block border-l-4 border-l-emerald-400 pl-5 text-xs uppercase tracking-wider text-muted-foreground">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 min-h-40 w-full border-b-2 border-border bg-transparent p-3 text-sm normal-case text-foreground focus:border-emerald-400 focus:outline-none" />
        </label>
        <label className="block border-l-4 border-l-amber-400 pl-5 text-xs uppercase tracking-wider text-muted-foreground">
          Contract execution payload
          <textarea value={executionPayload} onChange={(e) => setExecutionPayload(e.target.value)} placeholder="Optional JSON or contract call data" className="mt-2 min-h-28 w-full border-b-2 border-border bg-transparent p-3 font-mono text-sm normal-case text-foreground focus:border-amber-400 focus:outline-none" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <Button type="submit" isLoading={submitting} leftIcon={<Send className="h-4 w-4" />} rightIcon={<FileCode2 className="h-4 w-4" />}>Submit proposal</Button>
      </form>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpCircle, ArrowDownCircle, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { get } from "@/lib/api-client"
import { cn } from "@/lib/cn"
import { formatAddress } from "@/lib/formatters"

interface TxItem {
  id: string
  type: "sent" | "received"
  amount: number
  description: string
  createdAt: string
  txnHash?: string
  source: "contribution" | "payout"
}

const PAGE_SIZE = 15

export default function TransactionsPage() {
  const [txns, setTxns] = useState<TxItem[]>([])
  const [filtered, setFiltered] = useState<TxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [cRes, pRes] = await Promise.allSettled([
          get("/contributions"),
          get("/payouts"),
        ])
        const all: TxItem[] = []
        if (cRes.status === "fulfilled") {
          const d = (cRes.value as Record<string, unknown>)?.data as Record<string, unknown> ?? cRes.value as Record<string, unknown>
          ;((d?.contributions ?? []) as Record<string, unknown>[]).forEach((c: Record<string, unknown>) => {
            all.push({
              id: String(c.id ?? ""),
              type: "sent",
              amount: Number(c.amount ?? 0),
              description: `Contribution${c.circleId ? "" : ""}`,
              createdAt: String(c.createdAt ?? ""),
              txnHash: String(c.txnHash ?? ""),
              source: "contribution",
            })
          })
        }
        if (pRes.status === "fulfilled") {
          const d = (pRes.value as Record<string, unknown>)?.data as Record<string, unknown> ?? pRes.value as Record<string, unknown>
          ;((d?.payouts ?? []) as Record<string, unknown>[]).forEach((p: Record<string, unknown>) => {
            all.push({
              id: String(p.id ?? ""),
              type: "received",
              amount: Number(p.amount ?? 0),
              description: "Payout",
              createdAt: String(p.createdAt ?? ""),
              txnHash: String(p.txnHash ?? ""),
              source: "payout",
            })
          })
        }
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setTxns(all)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = txns
    if (filterType !== "all") {
      result = result.filter((t) => t.type === filterType)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.description.toLowerCase().includes(q) || t.txnHash?.toLowerCase().includes(q))
    }
    setFiltered(result)
    setPage(1)
  }, [txns, filterType, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Full history of all contributions and payouts." />

      {/* Filters — inline bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {["all", "sent", "received"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filterType === f ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "All" : f === "sent" ? "Sent" : "Received"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description or hash..."
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState icon={<ArrowUpCircle className="h-6 w-6" />} title="No transactions" description="No contributions or payouts found." />
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {pageItems.map((tx) => (
              <Link
                key={tx.id}
                href={`/wallet/transactions/${tx.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                    tx.type === "received" ? "bg-emerald-500/15 text-emerald-400" : "bg-aurora-violet/15 text-aurora-violet",
                  )}>
                    {tx.type === "received" ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn("text-sm font-semibold font-heading", tx.type === "received" ? "text-emerald-400" : "text-muted-foreground")}>
                    {tx.type === "received" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </span>
                  {tx.txnHash && (
                    <span className="hidden sm:inline text-xs font-mono text-muted-foreground">{formatAddress(tx.txnHash, 4, 4)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

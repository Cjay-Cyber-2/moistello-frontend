"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { get } from "@/lib/api-client"
import { DataTable, type DataTableColumn } from "@/components/shared/data-table"
import { PageError, PageLoading } from "@/components/shared/page-state"
import type { ApiResponse } from "@/types"
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
  const { data: txns = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const [cRes, pRes] = await Promise.allSettled([
        get<ApiResponse<{ contributions?: Record<string, unknown>[] }>>("/contributions"),
        get<ApiResponse<{ payouts?: Record<string, unknown>[] }>>("/payouts"),
      ])
      const all: TxItem[] = []
      if (cRes.status === "fulfilled") (cRes.value.data?.contributions ?? []).forEach((c) => all.push({ id: String(c.id ?? ""), type: "sent", amount: Number(c.amount ?? 0), description: "Contribution", createdAt: String(c.createdAt ?? ""), txnHash: c.txnHash ? String(c.txnHash) : undefined, source: "contribution" }))
      if (pRes.status === "fulfilled") (pRes.value.data?.payouts ?? []).forEach((p) => all.push({ id: String(p.id ?? ""), type: "received", amount: Number(p.amount ?? 0), description: "Payout", createdAt: String(p.createdAt ?? ""), txnHash: p.txnHash ? String(p.txnHash) : undefined, source: "payout" }))
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
  })
  const [filterType, setFilterType] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = filterType === "all" ? txns : txns.filter((t) => t.type === filterType)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.description.toLowerCase().includes(q) || t.txnHash?.toLowerCase().includes(q))
    }
    return result
  }, [txns, filterType, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const columns: DataTableColumn<TxItem>[] = [
    { id: "description", header: "Transaction", cell: (tx) => <div className="flex items-center gap-3"><div className={cn("flex h-9 w-9 items-center justify-center rounded-full shrink-0", tx.type === "received" ? "bg-emerald-500/15 text-emerald-400" : "bg-aurora-violet/15 text-aurora-violet")}>{tx.type === "received" ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}</div><div><p className="font-medium text-foreground">{tx.description}</p><p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div></div> },
    { id: "amount", header: "Amount", accessor: (tx) => tx.amount, sortable: true, cell: (tx) => <span className={cn("font-semibold", tx.type === "received" ? "text-emerald-400" : "text-muted-foreground")}>{tx.type === "received" ? "+" : "-"}${tx.amount.toFixed(2)}</span> },
    { id: "hash", header: "Hash", cell: (tx) => tx.txnHash ? <span className="font-mono text-xs text-muted-foreground">{formatAddress(tx.txnHash)}</span> : "—" },
  ]

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
      {isLoading ? <PageLoading /> : isError ? <PageError onRetry={() => void refetch()} /> : <DataTable data={pageItems} columns={columns} getRowId={(tx) => tx.id} caption="Transaction history" emptyState={<EmptyState icon={<ArrowUpCircle className="h-6 w-6" />} title="No transactions" description="No contributions or payouts found." />} />}

      {/* Pagination */}
      {totalPages > 1 && <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground"><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="disabled:opacity-30">Previous</button><span>{currentPage} / {totalPages}</span><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="disabled:opacity-30">Next</button></div>}
    </div>
  )
}

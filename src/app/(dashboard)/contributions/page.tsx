"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpCircle,
  AlertCircle,
  Search,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import { useContributions } from "@/hooks/use-contributions"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate, formatAddress } from "@/lib/formatters"
import type {
  ApiResponse,
  Circle,
  ContributionStatus,
} from "@/types"

function TransactionLink({ hash }: { hash: string }) {
  return (
    <a
      href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-aurora-cyan hover:underline font-mono"
    >
      {formatAddress(hash)}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

const statusConfig: Record<ContributionStatus, { variant: "success" | "warning" | "destructive" | "default" }> = {
  confirmed: { variant: "success" },
  pending: { variant: "warning" },
  failed: { variant: "destructive" },
  late: { variant: "destructive" },
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function ContributionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [circleFilter, setCircleFilter] = useState("")
  const [amountFilter, setAmountFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [sortOption, setSortOption] = useState("date-desc")
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: circlesData } = useQuery({
    queryKey: ["circles", "contributions-filter"],
    queryFn: async () => {
      const response = await get<ApiResponse<{ circles: Circle[] }>>("/circles?limit=100")
      return response.data?.circles ?? []
    },
  })

  const circles = circlesData ?? []
  const circleOptions = [
    { label: "All Circles", value: "" },
    ...circles.map((c) => ({ label: c.name, value: c.id })),
  ]

  const { data, isLoading, isError } = useContributions({
    search: searchQuery,
    circleId: circleFilter,
    amount: amountFilter,
    date: dateFilter,
    sort: sortOption,
    page,
    limit,
  })

  const contributions = data?.contributions ?? []
  const summary = data?.summary
  const meta = data?.meta
  const hasNext = meta ? meta.page < meta.totalPages : false
  const hasPrev = page > 1

  const amountOptions = [
    { label: "All Amounts", value: "" },
    { label: "Under $100", value: "<100" },
    { label: "$100 - $500", value: "100-500" },
    { label: "Over $500", value: ">500" },
  ]

  const dateOptions = [
    { label: "All Time", value: "" },
    { label: "Past 7 Days", value: "7d" },
    { label: "Past 30 Days", value: "30d" },
    { label: "This Year", value: "1y" },
  ]

  const sortOptions = [
    { label: "Newest First", value: "date-desc" },
    { label: "Oldest First", value: "date-asc" },
    { label: "Amount: High to Low", value: "amount-desc" },
    { label: "Amount: Low to High", value: "amount-asc" },
  ]

  const getCircleName = (circleId: string): string =>
    circles.find((c) => c.id === circleId)?.name ?? "Unknown"

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Contributions"
        description="Track all your circle contributions and their status."
      />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-premium rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-sm font-medium text-muted-foreground font-heading uppercase tracking-wider mb-1">Total Contributed</p>
            <p className="font-heading text-2xl font-bold gradient-text">{formatCurrency(summary.totalContributed, "USDC")}</p>
          </div>
          <div className="glass-premium rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-sm font-medium text-muted-foreground font-heading uppercase tracking-wider mb-1">Average Amount</p>
            <p className="font-heading text-2xl font-bold text-foreground">{formatCurrency(summary.average, "USDC")}</p>
          </div>
          <div className="glass-premium rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-sm font-medium text-muted-foreground font-heading uppercase tracking-wider mb-1">Total Count</p>
            <p className="font-heading text-2xl font-bold text-foreground">{summary.count}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-3 bg-background/40 p-3 rounded-xl border border-border/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contributions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-background/50 border-border/50 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground hidden md:block ml-2 shrink-0" />
          <div className="w-32 shrink-0">
            <Select
              options={circleOptions}
              value={circleFilter}
              onChange={(value) => {
                setCircleFilter(value)
                setPage(1)
              }}
              placeholder="Circle"
            />
          </div>
          <div className="w-32 shrink-0">
            <Select
              options={amountOptions}
              value={amountFilter}
              onChange={(value) => {
                setAmountFilter(value)
                setPage(1)
              }}
              placeholder="Amount"
            />
          </div>
          <div className="w-32 shrink-0">
            <Select
              options={dateOptions}
              value={dateFilter}
              onChange={(value) => {
                setDateFilter(value)
                setPage(1)
              }}
              placeholder="Date"
            />
          </div>
          <div className="w-40 shrink-0">
            <Select
              options={sortOptions}
              value={sortOption}
              onChange={(value) => {
                setSortOption(value)
                setPage(1)
              }}
              placeholder="Sort by"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-premium rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton variant="text" width="25%" />
                <Skeleton variant="text" width="8%" />
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="12%" />
                <Skeleton variant="text" width="18%" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load contributions"
          description="Something went wrong. Please try again later."
        />
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={<ArrowUpCircle className="h-6 w-6" />}
          title="No contributions yet"
          description="Join a circle to get started!"
          action={{
            label: "Browse Circles",
            onClick: () => (window.location.href = "/circles"),
          }}
        />
      ) : (
        <div className="glass-premium rounded-2xl overflow-hidden holo-border">
          <div className="hidden md:flex items-center gap-4 border-b border-border glass-strong px-5 py-3">
            <div className="flex-1 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Circle
            </div>
            <div className="w-16 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Round
            </div>
            <div className="w-28 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Amount
            </div>
            <div className="w-28 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Date
            </div>
            <div className="w-24 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Status
            </div>
            <div className="w-36 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Transaction
            </div>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
            className="divide-y divide-border"
          >
            {contributions.map((c) => {
              const st = statusConfig[c.status] || statusConfig.pending
              const isOnTime = c.onTime
              const displayStatus = isOnTime
                ? "completed"
                : c.status

              return (
                <motion.div
                  key={c.id}
                  variants={rowVariants}
                  className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:gap-4 hover:glass-whisper transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/circles/${c.circleId}`}
                      className="text-sm font-medium text-foreground dark:text-white hover:gradient-text transition-colors truncate block font-heading"
                    >
                      {getCircleName(c.circleId)}
                    </Link>
                    <span className="text-xs text-muted-foreground md:hidden">
                      Round {c.roundNumber}
                    </span>
                  </div>
                  <div className="hidden md:block w-16 text-sm text-muted-foreground font-mono">
                    #{c.roundNumber}
                  </div>
                  <div className="w-28 text-sm font-bold gradient-text font-heading">
                    {formatCurrency(c.amount, "USDC")}
                  </div>
                  <div className="w-28 text-sm text-muted-foreground font-body">
                    {formatDate(c.createdAt)}
                  </div>
                  <div className="w-24">
                    <Badge
                      variant={isOnTime ? "success" : st.variant}
                      size="sm"
                    >
                      {isOnTime ? "On Time" : displayStatus}
                    </Badge>
                  </div>
                  <div className="w-36">
                    {c.txnHash ? (
                      <TransactionLink hash={c.txnHash} />
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">
                        Pending
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-body">
            Page {meta.page} of {meta.totalPages} ({meta.total} contributions)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

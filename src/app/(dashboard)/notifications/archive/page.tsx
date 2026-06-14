"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BellOff, ArrowUp, ArrowDown, CircleDot, AlertTriangle, CheckCheck, UserPlus, DollarSign, Shield, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { get } from "@/lib/api-client"
import { cn } from "@/lib/cn"
import { formatRelativeTime } from "@/lib/formatters"
import type { Notification } from "@/types"

const iconMap: Record<string, React.ReactNode> = {
  contribution: <ArrowUp className="h-4 w-4" />,
  contribution_received: <ArrowDown className="h-4 w-4" />,
  payout: <ArrowDown className="h-4 w-4" />,
  payout_received: <DollarSign className="h-4 w-4" />,
  circle: <CircleDot className="h-4 w-4" />,
  circle_joined: <UserPlus className="h-4 w-4" />,
  circle_completed: <CheckCheck className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  penalty: <Shield className="h-4 w-4" />,
}

const gradientMap: Record<string, string> = {
  contribution: "from-emerald-500/30 to-green-600/30",
  contribution_received: "from-emerald-500/30 to-green-600/30",
  payout: "from-aurora-indigo/30 to-aurora-violet/30",
  payout_received: "from-aurora-indigo/30 to-aurora-violet/30",
  circle: "from-aurora-violet/30 to-fuchsia-500/30",
  circle_joined: "from-aurora-violet/30 to-fuchsia-500/30",
  circle_completed: "from-aurora-violet/30 to-fuchsia-500/30",
  system: "from-white/5 to-white/10",
  warning: "from-red-500/30 to-amber-500/30",
  penalty: "from-red-500/30 to-amber-500/30",
}

const iconColorMap: Record<string, string> = {
  contribution: "text-emerald-400",
  contribution_received: "text-emerald-400",
  payout: "text-aurora-violet",
  payout_received: "text-aurora-violet",
  circle: "text-fuchsia-400",
  circle_joined: "text-fuchsia-400",
  circle_completed: "text-fuchsia-400",
  system: "text-muted-foreground",
  warning: "text-red-400",
  penalty: "text-red-400",
}

const PAGE_SIZE = 20

export default function NotificationsArchivePage() {
  const [all, setAll] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    get(`/notifications?limit=100&page=${page}`)
      .then((res: unknown) => {
        const d = (res as Record<string, unknown>)?.data as Record<string, unknown> ?? res as Record<string, unknown>
        setAll((d?.notifications ?? []) as Notification[])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const archive = all.filter((n) => n.isRead)
  const totalPages = Math.max(1, Math.ceil(archive.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = archive.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Archive</h1>
          <p className="text-sm text-muted-foreground">Read notifications</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState icon={<BellOff className="h-6 w-6" />} title="Archive empty" description="No read notifications yet." />
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/[0.06]">
          {pageItems.map((n) => {
            const icon = iconMap[n.type] ?? <Info className="h-4 w-4" />
            const grad = gradientMap[n.type] ?? gradientMap.system
            const icol = iconColorMap[n.type] ?? iconColorMap.system
            return (
              <div key={n.id} className="flex items-start gap-4 px-5 py-4">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br", grad)}>
                  <span className={icol}>{icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-xs text-muted-foreground/40 mt-1">
                    {n.sentAt ? formatRelativeTime(n.sentAt) : formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

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

      <Link href="/notifications" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Notifications
      </Link>
    </div>
  )
}

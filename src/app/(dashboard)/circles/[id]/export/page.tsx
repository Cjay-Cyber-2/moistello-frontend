"use client"

import React, { useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useCircle, useCircleMembers, useCircleRounds } from "@/hooks/use-circles"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { ArrowLeft, Download, FileText, Table, Check, AlertCircle } from "lucide-react"
import { copyToClipboard } from "@/lib/clipboard"

type ExportScope = "all" | "members" | "contributions" | "payouts"
type ExportFormat = "csv" | "json"

export default function ExportPage() {
  const params = useParams()
  const circleId = params.id as string

  const { data: circle } = useCircle(circleId)
  const { data: members = [] } = useCircleMembers(circleId)
  const { data: rounds = [] } = useCircleRounds(circleId)

  const [scope, setScope] = useState<ExportScope>("all")
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [copied, setCopied] = useState(false)

  const generateCSV = useCallback((): string => {
    const rows: string[][] = []
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`

    if (scope === "all" || scope === "members") {
      rows.push(["Member ID", "Name", "Position", "Status", "Joined At"])
      for (const m of members) {
        rows.push([escape(m.userId), escape(m.userName || "Anonymous"), String(m.position), m.status, m.joinedAt])
      }
      rows.push([])
    }

    if (scope === "all" || scope === "contributions") {
      rows.push(["Round", "User ID", "Amount", "Status", "On Time", "Submitted At"])
      for (const r of rounds) {
        rows.push([String(r.roundNumber), escape(r.userId), String(r.amount), r.status, String(r.onTime), r.submittedAt])
      }
      rows.push([])
    }

    return rows.map((r) => r.join(",")).join("\n")
  }, [members, rounds, scope])

  const generateJSON = useCallback((): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {
      circle: circle ? { id: circle.id, name: circle.name, type: circle.circleType, status: circle.status, contributionAmount: circle.contributionAmount, currency: circle.currency, frequency: circle.frequency, maxMembers: circle.maxMembers, createdAt: circle.createdAt } : null,
    }
    if (scope === "all" || scope === "members") data.members = members
    if (scope === "all" || scope === "contributions") data.contributions = rounds
    return JSON.stringify(data, null, 2)
  }, [circle, members, rounds, scope])

  const handleCopy = async () => {
    const content = format === "csv" ? generateCSV() : generateJSON()
    const success = await copyToClipboard(content)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const content = format === "csv" ? generateCSV() : generateJSON()
    const ext = format === "csv" ? "csv" : "json"
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${circle?.name ?? "circle"}-export.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const scopes: { value: ExportScope; label: string; desc: string }[] = [
    { value: "all", label: "Everything", desc: "Members, contributions, and payouts" },
    { value: "members", label: "Members Only", desc: "Member list with positions and join dates" },
    { value: "contributions", label: "Contributions", desc: "All contribution records across rounds" },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Export Data"
        description="Download circle data as CSV or JSON"
        breadcrumbs={[
          { label: "Circles", href: "/circles" },
          { label: circle?.name ?? "Circle", href: `/circles/${circleId}` },
          { label: "Export" },
        ]}
        action={
          <Link href={`/circles/${circleId}`}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
          </Link>
        }
      />

      <div className="glass-premium rounded-2xl p-6 holo-border space-y-6">
        <div>
          <h3 className="text-sm font-heading font-semibold text-foreground dark:text-white mb-3">Export Scope</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {scopes.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setScope(s.value)}
                className={cn(
                  "rounded-xl p-4 text-left transition-all border",
                  scope === s.value ? "gradient-bg-extended text-white border-transparent" : "glass-whisper text-muted-foreground hover:text-foreground border-border",
                )}
              >
                <p className="text-sm font-heading font-semibold">{s.label}</p>
                <p className="text-xs mt-1 opacity-70">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-heading font-semibold text-foreground dark:text-white mb-3">Format</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-body transition-all border",
                format === "csv" ? "gradient-bg-extended text-white border-transparent" : "glass-whisper text-muted-foreground hover:text-foreground border-border",
              )}
            >
              <Table className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => setFormat("json")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-body transition-all border",
                format === "json" ? "gradient-bg-extended text-white border-transparent" : "glass-whisper text-muted-foreground hover:text-foreground border-border",
              )}
            >
              <FileText className="h-4 w-4" />
              JSON
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex items-center gap-3">
          <Button variant="primary" size="md" onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>
            Download
          </Button>
          <Button variant="outline" size="md" onClick={handleCopy} leftIcon={copied ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}>
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
        </div>
      </div>

      <div className="glass-whisper rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">Exported data includes all currently loaded records. For large circles with many rounds, only the most recent data is included.</p>
      </div>
    </div>
  )
}

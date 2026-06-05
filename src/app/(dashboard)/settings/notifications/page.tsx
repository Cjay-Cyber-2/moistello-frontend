"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { put } from "@/lib/api-client"

interface ToggleRow {
  key: string
  label: string
  hint: string
  enabled: boolean
}

const CATEGORIES: ToggleRow[] = [
  { key: "contributions", label: "Contributions", hint: "When a contribution is recorded or missed", enabled: true },
  { key: "payouts", label: "Payouts", hint: "When you receive or send a payout", enabled: true },
  { key: "invitations", label: "Invitations", hint: "When someone invites you to a circle", enabled: true },
  { key: "disputes", label: "Disputes", hint: "When a dispute is raised or resolved", enabled: true },
  { key: "announcements", label: "Announcements", hint: "Platform-wide updates and notices", enabled: true },
  { key: "circleActivity", label: "Circle Activity", hint: "Member joins, exits, and status changes", enabled: false },
  { key: "friendRequests", label: "Friend Requests", hint: "When someone sends you a friend request", enabled: true },
]

const FREQUENCIES = [
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily digest" },
  { value: "off", label: "Off" },
]

export default function NotificationsSettingsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, c.enabled]))
  )
  const [frequency, setFrequency] = useState("instant")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const enabledKeys = Object.entries(toggles)
        .filter(([, v]) => v)
        .map(([k]) => k)
      await put("/notifications/preferences", {
        channels: enabledKeys,
        frequency,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
    } finally {
      setSaving(false)
    }
  }, [toggles, frequency])

  const toggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Choose what notifications you receive</p>
        </div>
      </div>

      <div className="glass-premium rounded-2xl p-6 space-y-5">
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-aurora-violet" />
          Notification Categories
        </h3>

        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.hint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={toggles[cat.key]}
                onClick={() => toggle(cat.key)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  toggles[cat.key] ? "bg-aurora-violet" : "bg-white/10"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    toggles[cat.key] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-premium rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-sm font-semibold text-foreground">Frequency</h3>
        <div className="space-y-2">
          {FREQUENCIES.map((f) => (
            <label key={f.value} className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="radio"
                name="frequency"
                value={f.value}
                checked={frequency === f.value}
                onChange={(e) => setFrequency(e.target.value)}
                className="h-4 w-4 accent-aurora-violet"
              />
              <span className="text-sm text-foreground">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href="/settings">
          <Button variant="outline" size="md">Cancel</Button>
        </Link>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button variant="primary" size="md" onClick={handleSave} isLoading={saving}>
          Save Preferences
        </Button>
      </div>
    </div>
  )
}

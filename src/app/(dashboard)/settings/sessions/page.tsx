"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Trash2, Monitor, Smartphone, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { del } from "@/lib/api-client"
import { useTranslate } from "@/lib/locale/context"

interface Session {
  id: string
  device: string
  browser: string
  os: string
  ip: string
  lastActive: string
  isCurrent: boolean
  location: string
}

const mockSessions: Session[] = [
  {
    id: "1",
    device: "MacBook Pro",
    browser: "Chrome 125",
    os: "macOS 14.5",
    ip: "102.89.34.12",
    lastActive: "Just now",
    isCurrent: true,
    location: "Lagos, Nigeria",
  },
  {
    id: "2",
    device: "iPhone 15",
    browser: "Safari",
    os: "iOS 18",
    ip: "102.89.34.12",
    lastActive: "2 hours ago",
    isCurrent: false,
    location: "Lagos, Nigeria",
  },
  {
    id: "3",
    device: "Windows PC",
    browser: "Firefox 127",
    os: "Windows 11",
    ip: "197.210.64.88",
    lastActive: "3 days ago",
    isCurrent: false,
    location: "Abuja, Nigeria",
  },
]

function DeviceIcon({ device }: { device: string }) {
  if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("android")) {
    return <Smartphone className="h-5 w-5" />
  }
  if (device.toLowerCase().includes("mac") || device.toLowerCase().includes("windows")) {
    return <Monitor className="h-5 w-5" />
  }
  return <Globe className="h-5 w-5" />
}

export default function SessionsSettingsPage() {
  const { t } = useTranslate()
  const [sessions] = useState<Session[]>(mockSessions)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)

  const handleRevoke = useCallback(async (sessionId: string) => {
    try {
      await del(`/sessions/${sessionId}`)
    } catch {
    }
    setConfirmRevoke(null)
  }, [])

  const handleRevokeAll = useCallback(async () => {
    try {
      await del("/sessions")
    } catch {
    }
  }, [])

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">{t("session.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("session.desc")}</p>
        </div>
      </div>

      {sessions.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeAll}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            className="text-red-400 border-red-500/20 hover:bg-red-500/10"
          >
            Revoke All Other Sessions
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`glass-premium rounded-2xl p-5 transition-all ${
              confirmRevoke === session.id ? "ring-2 ring-red-500/30" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aurora-violet/20 to-aurora-indigo/20 text-aurora-violet shrink-0">
                <DeviceIcon device={session.device} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{session.device}</p>
                  {session.isCurrent && (
                    <span className="inline-flex h-5 items-center rounded-full bg-emerald-500/15 px-2 text-[10px] font-medium text-emerald-400">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {session.browser} &middot; {session.os}
                </p>
                <div className="flex items-center gap-3 mt-2 text-2xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.lastActive}
                  </span>
                  <span>{session.location}</span>
                  <span className="font-mono">{session.ip}</span>
                </div>
              </div>
              <div className="shrink-0">
                {session.isCurrent ? (
                  <span className="text-2xs text-muted-foreground px-2">This device</span>
                ) : confirmRevoke === session.id ? (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevoke(session.id)}
                      className="h-8 text-xs"
                    >
                      Confirm
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmRevoke(null)} className="h-8 text-xs">
                      Keep
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRevoke(session.id)}
                    className="h-8 text-xs text-red-400"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="glass-premium rounded-2xl p-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        </div>
      )}
    </div>
  )
}

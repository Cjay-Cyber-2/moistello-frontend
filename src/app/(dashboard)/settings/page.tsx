"use client"

import Link from "next/link"
import {
  User,
  Bell,
  Shield,
  Clock,
  Palette,
  CreditCard,
  Globe,
  PiggyBank,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/cn"
import { formatAddress } from "@/lib/formatters"

interface SettingSection {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  description: string
  badge?: string
}

const sections: SettingSection[] = [
  {
    id: "profile",
    label: "Profile",
    icon: <User className="h-5 w-5" />,
    href: "/settings/profile",
    description: "Display name, avatar, public profile",
  },
  {
    id: "account",
    label: "Account",
    icon: <Shield className="h-5 w-5" />,
    href: "/settings/account",
    description: "Username, email, language, timezone",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="h-5 w-5" />,
    href: "/settings/notifications",
    description: "Push, in-app alerts, frequency",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: <Shield className="h-5 w-5" />,
    href: "/settings/privacy",
    description: "Profile visibility, leaderboard, friend requests",
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: <Clock className="h-5 w-5" />,
    href: "/settings/sessions",
    description: "Active sessions, device management",
  },
  {
    id: "theme",
    label: "Appearance",
    icon: <Palette className="h-5 w-5" />,
    href: "/settings/theme",
    description: "Theme, density, font size",
  },
  {
    id: "payment",
    label: "Payment",
    icon: <CreditCard className="h-5 w-5" />,
    href: "/settings/payment",
    description: "Saved banks, withdrawal method, currency",
  },
  {
    id: "language",
    label: "Language & Region",
    icon: <Globe className="h-5 w-5" />,
    href: "/settings/language",
    description: "Language, date format, number format",
  },
  {
    id: "savings",
    label: "Savings Goals",
    icon: <PiggyBank className="h-5 w-5" />,
    href: "/settings/savings",
    description: "Goals, auto-contribute, round-ups",
  },
]

export default function SettingsHubPage() {
  const { user } = useAuth()

  return (
    <div className="flex gap-6">
      {/* Settings Sidebar */}
      <aside className="hidden md:block w-64 shrink-0">
        <nav className="space-y-1 sticky top-24">
          <div className="px-3 pb-3 mb-2 border-b border-white/[0.06]">
            <h2 className="font-heading text-sm font-bold text-foreground">Settings</h2>
            <p className="text-2xs text-muted-foreground mt-0.5">Manage your account</p>
          </div>
          {sections.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                "hover:glass-whisper text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="shrink-0 text-muted-foreground">{s.icon}</span>
              <span className="flex-1 truncate">{s.label}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account, preferences, and connected wallets.
          </p>
        </div>

        {/* Account Summary Card */}
        <div className="glass-premium rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-bg text-white font-mono text-lg font-bold shrink-0">
              {user?.displayName?.charAt(0)?.toUpperCase() ?? user?.walletAddress?.slice(0, 2)?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-semibold text-foreground truncate">
                {user?.displayName ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {user?.walletAddress ? formatAddress(user.walletAddress, 8, 6) : "No wallet"}
              </p>
              <Link href="/settings/profile" className="text-xs text-aurora-violet hover:underline mt-1 inline-block">
                Edit profile
              </Link>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">MoiScore</p>
              <p className="font-heading text-lg font-bold gradient-text">{user?.moiScore ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Link key={s.id} href={s.href}>
              <div
                className={cn(
                  "glass rounded-2xl p-5 h-full transition-all duration-200",
                  "hover:glass-strong hover:-translate-y-0.5 cursor-pointer",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl mb-3",
                    "bg-gradient-to-br from-aurora-violet/20 to-aurora-indigo/20 text-aurora-violet",
                  )}
                >
                  {s.icon}
                </div>
                <h3
                  className="font-heading text-sm font-semibold mb-1 text-foreground"
                >
                  {s.label}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile-only: tab bar at bottom showing current active setting */}
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-40">
          <div className="glass-flagship rounded-2xl px-4 py-3 flex items-center justify-between overflow-x-auto gap-2">
            {sections.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className="flex flex-col items-center gap-1 px-2 py-1 shrink-0"
              >
                <span className="text-muted-foreground">{s.icon}</span>
                <span className="text-[9px] text-muted-foreground font-medium">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Shield, Users, Award, Calendar, Flag, UserPlus, UserMinus, CircleDot } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { get } from "@/lib/api-client"
import { formatDate } from "@/lib/formatters"

interface ProfileUser {
  id: string
  displayName?: string | null
  walletAddress: string
  moiScore: number
  createdAt: string
  bio?: string | null
}

interface CircleInfo {
  id: string
  name: string
  memberCount: number
  maxMembers: number
  status: string
}

export default function PeopleProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const { user: currentUser, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [circles, setCircles] = useState<CircleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [friendStatus] = useState<"none" | "friends">("none")

  const isOwnProfile = userId === "me" || currentUser?.id === userId

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const endpoint = userId === "me" ? "/users/me" : `/users/${userId}`
        const userRes = await get<unknown>(endpoint)
        const raw = userRes as Record<string, unknown>
        const userData = (raw?.data as Record<string, unknown> ?? raw) as Record<string, unknown>
        const p: ProfileUser = {
          id: String(userData.id ?? ""),
          displayName: userData.displayName ? String(userData.displayName) : null,
          walletAddress: String(userData.walletAddress ?? ""),
          moiScore: Number(userData.moiScore ?? 0),
          createdAt: String(userData.createdAt ?? new Date().toISOString()),
        }
        setProfile(p)

        try {
          const circlesRes = await get<{ data: { circles: CircleInfo[] } }>(`/users/${userId}/circles`)
          const circlesData = (circlesRes as unknown as { data?: { circles?: CircleInfo[] } })?.data?.circles ?? []
          setCircles(Array.isArray(circlesData) ? circlesData : [])
        } catch {
          setCircles([])
        }
      setError("User not found")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" />
        <div className="mx-auto max-w-xl space-y-4">
          <Skeleton variant="card" className="h-48 rounded-2xl" />
          <Skeleton variant="card" className="h-32 rounded-2xl" />
          <Skeleton variant="card" className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" />
        <EmptyState icon={<Users className="h-6 w-6" />} title="User not found" description="This user doesn't exist or the link is invalid." />
      </div>
    )
  }

  const initials = profile.displayName?.charAt(0)?.toUpperCase() ?? profile.walletAddress.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="View member profile and activity." />

      <div className="mx-auto max-w-xl space-y-5">
        {/* Profile Card */}
        <div className="glass-premium rounded-2xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-bg text-white font-mono text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="font-heading text-2xl font-bold text-foreground truncate">
                {profile.displayName ?? "Anonymous"}
              </h1>
              <p className="text-sm text-muted-foreground font-mono mt-0.5 break-all">
                {profile.walletAddress}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 justify-center sm:justify-start">
                <Badge variant="primary" size="sm" className="gap-1">
                  <Award className="h-3 w-3" />
                  Score: {profile.moiScore}
                </Badge>
                <span className="text-2xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>
              {isOwnProfile && (
                <div className="mt-4">
                  <Link href="/settings/profile">
                    <Button variant="outline" size="sm">
                      Edit Profile in Settings
                    </Button>
                  </Link>
                </div>
              )}
              {!isOwnProfile && isAuthenticated && (
                <div className="flex items-center gap-2 mt-4 justify-center sm:justify-start">
                  {friendStatus === "none" ? (
                    <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-3.5 w-3.5" />}>
                      Add Friend
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" leftIcon={<UserMinus className="h-3.5 w-3.5" />}>
                      Remove Friend
                    </Button>
                  )}
                  <Button variant="outline" size="sm" leftIcon={<Flag className="h-3.5 w-3.5" />}>
                    Report
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Circles Joined", value: circles.length, icon: <CircleDot className="h-4 w-4" /> },
            { label: "Completed", value: circles.filter(c => c.status === "completed").length, icon: <Award className="h-4 w-4" /> },
            { label: "MoiScore", value: profile.moiScore, icon: <Shield className="h-4 w-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="glass-whisper rounded-xl p-4 text-center">
              <p className="text-2xl font-bold gradient-text font-heading">{stat.value}</p>
              <p className="text-2xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Circles They're In */}
        <div className="glass-premium rounded-2xl p-5">
          <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-aurora-violet" />
            Circles
          </h3>
          {circles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not a member of any public circles.</p>
          ) : (
            <div className="space-y-2">
              {circles.slice(0, 5).map((c) => (
                <Link key={c.id} href={`/circles/${c.id}`}>
                  <div className="flex items-center justify-between glass-whisper rounded-xl px-4 py-3 hover:glass-strong transition-all">
                    <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                    <Badge variant={c.status === "active" ? "success" : "default"} size="sm">
                      {c.status}
                    </Badge>
                  </div>
                </Link>
              ))}
              {circles.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {circles.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="glass-premium rounded-2xl p-5">
          <h3 className="font-heading text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.moiScore >= 600 && (
              <Badge variant="primary" size="md" className="gap-1">
                <Shield className="h-3 w-3" /> Trusted Member
              </Badge>
            )}
            {profile.moiScore >= 300 && (
              <Badge variant="default" size="md" className="gap-1">
                <Award className="h-3 w-3" /> Rising Star
              </Badge>
            )}
            <Badge variant="outline" size="md" className="gap-1">
              <Users className="h-3 w-3" /> Early Adopter
            </Badge>
            {circles.length >= 3 && (
              <Badge variant="outline" size="md" className="gap-1">
                <CircleDot className="h-3 w-3" /> Circle Enthusiast
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

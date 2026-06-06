"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Users, Calendar, Globe, Heart, Share2, UserPlus,
  MessageSquare, DollarSign, TrendingUp, Award, Shield,
  Sparkles, Pin, Trash2, Crown,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { get, post } from "@/lib/api-client"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/cn"
import { formatDate } from "@/lib/formatters"
import { Routes } from "@/lib/constants"

interface Community {
  id: string
  name: string
  slug: string
  description: string
  category: string
  tags: string[]
  avatarUrl?: string
  bannerUrl?: string
  ownerId: string
  memberCount: number
  totalSaved: number
  isFeatured: boolean
  createdAt: string
}

interface Member {
  userId: string
  role: string
  joinedAt: string
  displayName?: string
  walletAddress?: string
  moiScore?: number
}

interface Announcement {
  id: string
  content: string
  authorId: string
  isPinned: boolean
  likeCount: number
  createdAt: string
}

interface ActivityEvent {
  id: string
  eventType: string
  actorId?: string
  metadata: Record<string, string>
  createdAt: string
}

function getEventLabel(event: ActivityEvent): string {
  const labels: Record<string, string> = {
    member_join: "joined the community",
    circle_created: "created a new circle",
    payout_completed: "received a payout",
    contribution_made: "made a contribution",
    announcement_posted: "posted an announcement",
  }
  return labels[event.eventType] || event.eventType
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "finance": return <DollarSign className="h-4 w-4" />
    case "tech": return <Globe className="h-4 w-4" />
    default: return <Users className="h-4 w-4" />
  }
}

export default function CommunityDetailPage() {
  const params = useParams()
  const communityId = params.id as string
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)

  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [comRes, memRes, annRes, actRes] = await Promise.allSettled([
        get<unknown>(`/communities/${communityId}`),
        get<unknown>(`/communities/${communityId}/members`),
        get<unknown>(`/communities/${communityId}/announcements`),
        get<unknown>(`/communities/${communityId}/activity`),
      ])

      if (comRes.status === "fulfilled") {
        const raw = comRes.value as Record<string, unknown>
        const data = (raw.data ?? raw) as Record<string, unknown>
        setCommunity(data.community as Community)
      }

      if (memRes.status === "fulfilled") {
        const raw = memRes.value as Record<string, unknown>
        const data = (raw.data ?? raw) as Record<string, unknown>
        setMembers(data.members as Member[] ?? [])
      }

      if (annRes.status === "fulfilled") {
        const raw = annRes.value as Record<string, unknown>
        const data = (raw.data ?? raw) as Record<string, unknown>
        setAnnouncements(data.announcements as Announcement[] ?? [])
      }

      if (actRes.status === "fulfilled") {
        const raw = actRes.value as Record<string, unknown>
        const data = (raw.data ?? raw) as Record<string, unknown>
        setActivity(data.events as ActivityEvent[] ?? [])
      }

      if (user) {
        try {
          const memCheck = await get<unknown>(`/communities/${communityId}/membership`)
          const raw = memCheck as Record<string, unknown>
          const data = (raw.data ?? raw) as Record<string, unknown>
          setIsMember(!!data.isMember)
        } catch {}
      }
    } catch {
      setCommunity(null)
    } finally {
      setLoading(false)
    }
  }, [communityId, user])

  useEffect(() => { load() }, [load])

  const handleJoin = async () => {
    try {
      await post(`/communities/${communityId}/join`)
      setIsMember(true)
      setCommunity((prev) => prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev)
      addToast({ type: "success", title: "Joined!", description: "You are now a member of this community." })
    } catch {
      addToast({ type: "error", title: "Failed to join", description: "Please try again." })
    }
  }

  const handleTogglePin = async (a: Announcement) => {
    try {
      const { patch } = await import("@/lib/api-client")
      await patch(`/communities/${communityId}/announcements/${a.id}/pin`, { pinned: !a.isPinned })
      setAnnouncements((prev) => prev.map((x) => x.id === a.id ? { ...x, isPinned: !x.isPinned } : x))
      addToast({ type: "success", title: a.isPinned ? "Unpinned" : "Pinned!" })
    } catch {
      addToast({ type: "error", title: "Failed" })
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const { del } = await import("@/lib/api-client")
      await del(`/communities/${communityId}/announcements/${id}`)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      addToast({ type: "success", title: "Deleted" })
    } catch {
      addToast({ type: "error", title: "Failed to delete" })
    }
  }

  const handleRemoveMember = async (targetId: string, name: string) => {
    try {
      const { del } = await import("@/lib/api-client")
      await del(`/communities/${communityId}/members/${targetId}`)
      setMembers((prev) => prev.filter((m) => m.userId !== targetId))
      setCommunity((prev) => prev ? { ...prev, memberCount: prev.memberCount - 1 } : prev)
      addToast({ type: "success", title: `${name} removed` })
    } catch {
      addToast({ type: "error", title: "Failed to remove member" })
    }
  }

  const [transferTarget, setTransferTarget] = useState("")
  const [showTransfer, setShowTransfer] = useState(false)

  const handleTransferOwnership = async () => {
    if (!transferTarget) return
    try {
      const { post } = await import("@/lib/api-client")
      await post(`/communities/${communityId}/transfer-ownership`, { newOwnerId: transferTarget })
      addToast({ type: "success", title: "Ownership transferred!" })
      setShowTransfer(false)
      setTransferTarget("")
      load()
    } catch {
      addToast({ type: "error", title: "Failed to transfer ownership" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Community" />
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton variant="card" className="h-56 rounded-2xl" />
          <Skeleton variant="card" className="h-32 rounded-2xl" />
          <Skeleton variant="card" className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="space-y-6">
        <PageHeader title="Community" />
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Community not found"
          description="This community doesn't exist or may have been removed."
        />
      </div>
    )
  }

  const isOrganizer = user?.id === community.ownerId
  const maxAvatarPreview = 8

  return (
    <div className="space-y-6">
      <PageHeader
        title={community.name}
        description={community.description}
        breadcrumbs={[
          { label: "Communities", href: Routes.COMMUNITIES },
          { label: community.name },
        ]}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="glass-premium rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg text-white font-mono text-2xl font-bold shrink-0">
              {community.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-2xl font-bold text-foreground">{community.name}</h1>
                {community.isFeatured && <Sparkles className="h-4 w-4 text-amber-400" />}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <Badge variant="outline" size="sm" className="gap-1">
                  {getCategoryIcon(community.category)}
                  {community.category.replace("_", " ")}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Created {formatDate(community.createdAt)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {community.description || "No description."}
              </p>

              {community.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {community.tags.map((tag) => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-aurora-violet" />
                    <strong className="text-foreground">{community.memberCount}</strong> members
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <strong className="text-foreground">${community.totalSaved.toFixed(2)}</strong> saved
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {user && !isMember && (
                    <Button variant="primary" size="sm" onClick={handleJoin} leftIcon={<UserPlus className="h-3.5 w-3.5" />}>
                      Join
                    </Button>
                  )}
                  {user && isMember && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 px-3 py-1.5 rounded-full bg-emerald-500/10">
                      <Shield className="h-3 w-3" /> Member
                    </span>
                  )}
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); addToast({ type: "info", title: "Link copied!" }) }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Members + Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Member avatars */}
            <div className="glass-premium rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-aurora-violet" />
                  Members
                </h3>
                <span className="text-xs text-muted-foreground">{members.length} total</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {members.slice(0, maxAvatarPreview).map((m) => (
                  <div key={m.userId} className="flex flex-col items-center gap-1 group relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet/30 to-aurora-indigo/30 text-foreground font-mono text-xs font-bold">
                      {(m.displayName?.charAt(0) ?? "U").toUpperCase()}
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[60px] text-center">
                      {m.role === "admin" ? "Admin" : m.role === "moderator" ? "Mod" : ""}
                    </span>
                    {isOrganizer && m.role !== "admin" && (
                      <button
                        onClick={() => handleRemoveMember(m.userId, m.displayName ?? "Member")}
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
                {members.length > maxAvatarPreview && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-xs text-muted-foreground font-medium">
                      +{members.length - maxAvatarPreview}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="glass-premium rounded-2xl p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-aurora-violet" />
                Activity
              </h3>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-aurora-violet/10 text-aurora-violet mt-0.5 shrink-0">
                        <TrendingUp className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-foreground">
                          <span className="font-medium">{event.metadata?.actorName ?? "Someone"}</span>{" "}
                          {getEventLabel(event)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Circles in this community */}
            <div className="glass-premium rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-aurora-violet" />
                  Savings Circles
                </h3>
                <Link href={`/circles/create?community=${community.id}`}>
                  <Button variant="outline" size="sm">Create Circle</Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Circles within this community will appear here. Create one to get started.
              </p>
            </div>
          </div>

          {/* Right: Announcements + Stats */}
          <div className="space-y-6">
            {/* Announcements */}
            <div className="glass-premium rounded-2xl p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-aurora-violet" />
                Announcements
              </h3>
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No announcements yet.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id} className={cn("glass-whisper rounded-xl p-3", a.isPinned && "border border-amber-500/20")}>
                      {a.isPinned && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-400 mb-1">
                          <Sparkles className="h-3 w-3" /> Pinned
                        </div>
                      )}
                      <p className="text-sm text-foreground">{a.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(a.createdAt)}</span>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <Heart className="h-3 w-3" /> {a.likeCount}
                        </button>
                        {isOrganizer && (
                          <>
                            <button
                              onClick={() => handleTogglePin(a)}
                              className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                            >
                              <Pin className={cn("h-3 w-3", a.isPinned && "text-amber-400")} />
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(a.id)}
                              className="flex items-center gap-1 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isOrganizer && (
                <CreateAnnouncementForm communityId={community.id} onCreated={load} />
              )}
            </div>

            {/* Community Stats Card */}
            <div className="glass-premium rounded-2xl p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-aurora-violet" />
                Stats
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Members", value: community.memberCount, icon: Users },
                  { label: "Total Saved", value: `$${community.totalSaved.toFixed(2)}`, icon: DollarSign },
                  { label: "Category", value: community.category.replace("_", " "), icon: Globe },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <stat.icon className="h-3.5 w-3.5" /> {stat.label}
                    </span>
                    <span className="font-medium text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>

              {isOrganizer && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                  {!showTransfer ? (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowTransfer(true)} leftIcon={<Crown className="h-3.5 w-3.5" />}>
                      Transfer Ownership
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={transferTarget}
                        onChange={(e) => setTransferTarget(e.target.value)}
                        className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-xs text-foreground"
                      >
                        <option value="">Select new owner...</option>
                        {members.filter((m) => m.userId !== user?.id).map((m) => (
                          <option key={m.userId} value={m.userId}>{m.displayName ?? m.userId.slice(0, 8)}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowTransfer(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" className="flex-1" onClick={handleTransferOwnership} disabled={!transferTarget}>
                          Transfer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateAnnouncementForm({ communityId, onCreated }: { communityId: string; onCreated: () => void }) {
  const [content, setContent] = useState("")
  const [posting, setPosting] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true)
    try {
      await post(`/communities/${communityId}/announcements`, { content: content.trim() })
      setContent("")
      addToast({ type: "success", title: "Posted!" })
      onCreated()
    } catch {
      addToast({ type: "error", title: "Failed to post" })
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Post an announcement..."
        rows={2}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 border-b border-white/10 focus:outline-none focus:border-aurora-violet/50 resize-none py-2"
      />
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={handlePost} isLoading={posting} disabled={!content.trim()}>
          Post
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Users, CircleDot, Trophy, Hash, UserPlus, Activity, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/ui-store"

interface GroupMember {
  name: string
  initials: string
}

interface RecentActivity {
  text: string
  time: string
}

interface Group {
  id: string
  name: string
  category: string
  memberCount: number
  description: string
  tags: string[]
  members: GroupMember[]
  activeCircles: number
  communityRank: number
  recentActivity: RecentActivity[]
}

const mockGroups: Group[] = [
  {
    id: "g1",
    name: "DeFi Builders",
    category: "Finance",
    memberCount: 128,
    description: "A community focused on building and discussing decentralized finance protocols, yield strategies, and on-chain innovations.",
    tags: ["DeFi", "Yield", "Layer 2", "Governance"],
    members: [
      { name: "Alice", initials: "A" },
      { name: "Bob", initials: "B" },
      { name: "Charlie", initials: "C" },
      { name: "Diana", initials: "D" },
      { name: "Eve", initials: "E" },
      { name: "Frank", initials: "F" },
      { name: "Grace", initials: "G" },
      { name: "Hank", initials: "H" },
      { name: "Ivy", initials: "I" },
      { name: "Jack", initials: "J" },
    ],
    activeCircles: 6,
    communityRank: 3,
    recentActivity: [
      { text: "John joined the group", time: "2m ago" },
      { text: "New circle created: Monthly Savings", time: "15m ago" },
      { text: "Alice posted a new proposal", time: "1h ago" },
      { text: "Governance vote ended — passed", time: "3h ago" },
    ],
  },
  {
    id: "g2",
    name: "NFT Collectors DAO",
    category: "Art",
    memberCount: 256,
    description: "Curating digital art and collectibles. We discuss mints, market trends, and host community auctions.",
    tags: ["NFT", "Art", "Collectibles", "Auctions"],
    members: [
      { name: "Mia", initials: "M" },
      { name: "Noah", initials: "N" },
      { name: "Olivia", initials: "O" },
      { name: "Liam", initials: "L" },
      { name: "Sophia", initials: "S" },
      { name: "Lucas", initials: "L" },
      { name: "Emma", initials: "E" },
      { name: "Mason", initials: "M" },
    ],
    activeCircles: 9,
    communityRank: 1,
    recentActivity: [
      { text: "New auction started: Genesis #42", time: "5m ago" },
      { text: "Mia listed a new collection", time: "30m ago" },
      { text: "DAO proposal: Increase treasury", time: "2h ago" },
      { text: "Weekly curator call scheduled", time: "5h ago" },
    ],
  },
  {
    id: "g3",
    name: "Web3 Devs",
    category: "Technology",
    memberCount: 89,
    description: "Open discussion for blockchain engineers, smart contract auditors, and dApp builders.",
    tags: ["Solidity", "Rust", "EVM", "Auditing"],
    members: [
      { name: "Zara", initials: "Z" },
      { name: "Yuki", initials: "Y" },
      { name: "Xander", initials: "X" },
      { name: "Wendy", initials: "W" },
      { name: "Victor", initials: "V" },
    ],
    activeCircles: 4,
    communityRank: 7,
    recentActivity: [
      { text: "Xander shared a new Solidity library", time: "10m ago" },
      { text: "Audit party: Round 3 complete", time: "1h ago" },
      { text: "New circle: Rust for WASM", time: "4h ago" },
    ],
  },
  {
    id: "g4",
    name: "Gaming Guild",
    category: "Gaming",
    memberCount: 312,
    description: "Play-to-earn gaming community. Tournaments, scholarship programs, and game strategy discussions.",
    tags: ["P2E", "Tournaments", "Scholarships", "Strategy"],
    members: [
      { name: "Tom", initials: "T" },
      { name: "Uma", initials: "U" },
      { name: "Vince", initials: "V" },
      { name: "Will", initials: "W" },
      { name: "Xena", initials: "X" },
      { name: "Yara", initials: "Y" },
      { name: "Zack", initials: "Z" },
    ],
    activeCircles: 11,
    communityRank: 2,
    recentActivity: [
      { text: "Weekend tournament registration open", time: "20m ago" },
      { text: "New scholarship program launched", time: "1h ago" },
      { text: "Guild treasury update: Q2 report", time: "6h ago" },
    ],
  },
]

function RelatedGroups({ currentGroup }: { currentGroup: Group }) {
  const related = mockGroups.filter((g) => g.category === currentGroup.category && g.id !== currentGroup.id).slice(0, 4)

  if (related.length === 0) return null

  return (
    <div className="glass-premium rounded-2xl p-5">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <Hash className="h-4 w-4 text-aurora-violet" />
        Related Groups
      </h3>
      <div className="space-y-2">
        {related.map((g) => (
          <Link key={g.id} href={`/people/${g.id}`}>
            <div className="flex items-center justify-between glass-whisper rounded-xl px-4 py-3 hover:glass-strong transition-all">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                <p className="text-2xs text-muted-foreground">{g.memberCount} members</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = params.id as string
  const addToast = useUIStore((s) => s.addToast)

  const group = mockGroups.find((g) => g.id === groupId) ?? null

  if (!group) {
    return (
      <div className="space-y-6">
        <PageHeader title="Group" />
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Group not found"
          description="This group doesn't exist or the link is invalid."
        />
      </div>
    )
  }

  const visibleMembers = group.members.slice(0, 8)
  const extraCount = group.memberCount - visibleMembers.length

  return (
    <div className="space-y-6">
      <PageHeader title={group.name} description="Community group details and activity." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Group Header */}
          <div className="glass-premium rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-bg text-white font-mono text-2xl font-bold shrink-0">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="font-heading text-2xl font-bold text-foreground truncate">{group.name}</h1>
                  <Badge variant="primary" size="sm">{group.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {group.memberCount.toLocaleString()} members
                </p>
                <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{group.description}</p>
              </div>
            </div>

            {/* Join Button */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={() =>
                  addToast({
                    type: "success",
                    title: "Joined group!",
                    description: `You are now a member of ${group.name}.`,
                  })
                }
              >
                Join Group
              </Button>
            </div>
          </div>

          {/* Member Avatars */}
          <div className="glass-premium rounded-2xl p-5">
            <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-aurora-violet" />
              Members
            </h3>
            <div className="flex items-center gap-1.5">
              {visibleMembers.map((m, i) => (
                <div
                  key={`${m.initials}-${i}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-aurora-violet/10 text-aurora-violet text-xs font-semibold border-2 border-background -ml-1 first:ml-0"
                  title={m.name}
                >
                  {m.initials}
                </div>
              ))}
              {extraCount > 0 && (
                <div className="flex h-9 items-center justify-center rounded-full bg-muted/30 text-muted-foreground text-xs font-medium px-2.5 border-2 border-background -ml-1">
                  +{extraCount} more
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Members", value: group.memberCount.toLocaleString(), icon: <Users className="h-4 w-4" /> },
              { label: "Active Circles", value: group.activeCircles, icon: <CircleDot className="h-4 w-4" /> },
              { label: "Community Rank", value: `#${group.communityRank}`, icon: <Trophy className="h-4 w-4" /> },
            ].map((stat) => (
              <div key={stat.label} className="glass-whisper rounded-xl p-4 text-center">
                <p className="text-2xl font-bold gradient-text font-heading">{stat.value}</p>
                <p className="text-2xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="glass-premium rounded-2xl p-5">
            <h3 className="font-heading text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-aurora-violet" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <Badge key={tag} variant="outline" size="md">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-premium rounded-2xl p-5">
            <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-aurora-violet" />
              Recent Activity
            </h3>
            {group.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-2">
                {group.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between glass-whisper rounded-xl px-4 py-3">
                    <span className="text-sm text-foreground">{a.text}</span>
                    <span className="text-2xs text-muted-foreground shrink-0 ml-3">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <RelatedGroups currentGroup={group} />
        </div>
      </div>
    </div>
  )
}

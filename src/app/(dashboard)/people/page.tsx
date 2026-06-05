"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Users,
  Plus,
  Hash,
  Building2,
  GraduationCap,
  Heart,
  Cpu,
  Globe,
  Activity,
  Sparkles,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/cn"

interface Group {
  id: string
  name: string
  description: string
  category: string
  memberCount: number
  tags: string[]
  isFeatured: boolean
}

const CATEGORIES = [
  "All",
  "Finance",
  "Tech",
  "Community",
  "Social Impact",
  "Education",
  "Health",
  "Creative Arts",
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Finance: <Building2 className="h-4 w-4" />,
  Tech: <Cpu className="h-4 w-4" />,
  Community: <Globe className="h-4 w-4" />,
  "Social Impact": <Heart className="h-4 w-4" />,
  Education: <GraduationCap className="h-4 w-4" />,
  Health: <Activity className="h-4 w-4" />,
  "Creative Arts": <Sparkles className="h-4 w-4" />,
}

const BADGE_VARIANTS: Record<string, "primary" | "success" | "warning" | "info" | "premium" | "destructive" | "outline"> = {
  Finance: "premium",
  Tech: "primary",
  Community: "info",
  "Social Impact": "destructive",
  Education: "warning",
  Health: "success",
  "Creative Arts": "outline",
}

const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "Crypto Enthusiasts Lagos",
    description: "A community for blockchain and crypto enthusiasts in Lagos to share knowledge and network.",
    category: "Finance",
    memberCount: 234,
    tags: ["crypto", "blockchain", "defi", "networking"],
    isFeatured: true,
  },
  {
    id: "2",
    name: "Women in Tech Africa",
    description: "Empowering women across Africa to thrive in technology careers through mentorship and resources.",
    category: "Tech",
    memberCount: 189,
    tags: ["women-in-tech", "mentorship", "STEM"],
    isFeatured: true,
  },
  {
    id: "3",
    name: "Monthly Savings Circle",
    description: "Collaborative savings group (ajo/esusu) helping members reach their financial goals together.",
    category: "Finance",
    memberCount: 56,
    tags: ["savings", "esusu", "financial-discipline"],
    isFeatured: false,
  },
  {
    id: "4",
    name: "Lagos Creatives",
    description: "A collective of artists, designers, writers, and musicians in Lagos collaborating on projects.",
    category: "Creative Arts",
    memberCount: 112,
    tags: ["art", "design", "music", "collaboration"],
    isFeatured: true,
  },
  {
    id: "5",
    name: "Alumni Association",
    description: "Stay connected with fellow alumni, share opportunities, and give back to the community.",
    category: "Community",
    memberCount: 89,
    tags: ["alumni", "networking", "mentorship"],
    isFeatured: false,
  },
  {
    id: "6",
    name: "Green Earth Initiative",
    description: "Environmental activists working on sustainability projects and community clean-up drives.",
    category: "Social Impact",
    memberCount: 145,
    tags: ["environment", "sustainability", "volunteering"],
    isFeatured: true,
  },
  {
    id: "7",
    name: "Code Africa Bootcamp",
    description: "Intensive peer-led coding bootcamp for aspiring software developers across the continent.",
    category: "Education",
    memberCount: 310,
    tags: ["coding", "bootcamp", "web-development"],
    isFeatured: true,
  },
  {
    id: "8",
    name: "Wellness Warriors",
    description: "A support group focused on mental health awareness, fitness, and holistic well-being.",
    category: "Health",
    memberCount: 73,
    tags: ["mental-health", "fitness", "wellness"],
    isFeatured: false,
  },
  {
    id: "9",
    name: "AI Researchers Network",
    description: "Deep technical discussions on machine learning, NLP, and computer vision research.",
    category: "Tech",
    memberCount: 128,
    tags: ["AI", "machine-learning", "research"],
    isFeatured: true,
  },
  {
    id: "10",
    name: "Young Entrepreneurs Hub",
    description: "Supporting early-stage founders with resources, feedback, and founder connections.",
    category: "Finance",
    memberCount: 201,
    tags: ["entrepreneurship", "startups", "funding"],
    isFeatured: false,
  },
  {
    id: "11",
    name: "Book Club Africa",
    description: "Monthly virtual book discussions featuring African authors and thought leaders.",
    category: "Education",
    memberCount: 67,
    tags: ["reading", "literature", "african-authors"],
    isFeatured: false,
  },
  {
    id: "12",
    name: "Foodies & Flavours",
    description: "Explore local cuisine, share recipes, and organize food tasting events.",
    category: "Community",
    memberCount: 94,
    tags: ["food", "recipes", "cooking"],
    isFeatured: false,
  },
  {
    id: "13",
    name: "Tech for Good",
    description: "Building technology solutions for social challenges in underserved communities.",
    category: "Social Impact",
    memberCount: 82,
    tags: ["tech4good", "social-innovation", "nonprofit"],
    isFeatured: false,
  },
  {
    id: "14",
    name: "Open Source Contributors",
    description: "Collaborate on open source projects and earn contributions to your portfolio.",
    category: "Tech",
    memberCount: 176,
    tags: ["open-source", "github", "collaboration"],
    isFeatured: true,
  },
]

export default function GroupsPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const filtered = useMemo(() => {
    return MOCK_GROUPS.filter((group) => {
      const matchSearch =
        !search.trim() ||
        group.name.toLowerCase().includes(search.toLowerCase()) ||
        group.description.toLowerCase().includes(search.toLowerCase()) ||
        group.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))

      const matchCategory = activeCategory === "All" || group.category === activeCategory

      return matchSearch && matchCategory
    })
  }, [search, activeCategory])

  const featured = useMemo(() => filtered.filter((g) => g.isFeatured), [filtered])
  const regular = useMemo(() => filtered.filter((g) => !g.isFeatured), [filtered])

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Discover"
        description="Find and join communities that match your interests."
        action={
          <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
            Create Group
          </Button>
        }
      />

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="mx-auto w-full max-w-xl">
          <Input
            placeholder="Search groups by name, description, or tags..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium font-body tracking-wide transition-all duration-300",
                  isActive
                    ? "gradient-bg-extended text-white"
                    : "glass-whisper text-muted-foreground hover:text-foreground hover:glass-strong",
                )}
              >
                {cat !== "All" && CATEGORY_ICONS[cat]}
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No groups found"
          description="Try adjusting your search or filter to discover more communities."
        />
      ) : (
        <div className="space-y-8">
          {/* Featured */}
          {featured.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-premium-gold" />
                <h2 className="font-heading text-lg font-bold text-foreground">Featured Communities</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </section>
          )}

          {/* Regular */}
          {regular.length > 0 && (
            <section>
              {featured.length > 0 && (
                <h2 className="font-heading text-lg font-bold text-foreground mb-4">All Communities</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regular.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function GroupCard({ group }: { group: Group }) {
  return (
    <Link href={`/people/${group.id}`}>
      <div className="glass-premium rounded-xl p-5 flex flex-col gap-3 hover:glass-strong transition-all duration-300 cursor-pointer h-full group">
        {/* Header row: category badge + member count */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant={BADGE_VARIANTS[group.category] ?? "default"} size="sm">
            {group.category}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Users className="h-3.5 w-3.5" />
            {group.memberCount}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-heading text-base font-bold text-foreground group-hover:gradient-text-extended transition-all duration-300">
          {group.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {group.description}
        </p>

        {/* Tags */}
        {group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {group.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                <Hash className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

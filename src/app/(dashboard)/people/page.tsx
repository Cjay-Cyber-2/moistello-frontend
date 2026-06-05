"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Search, Users } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { get } from "@/lib/api-client"

interface PeopleUser {
  id: string
  displayName?: string | null
  walletAddress: string
  moiScore: number
  createdAt: string
}

export default function PeoplePage() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<PeopleUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const limit = 20

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await get<{ data: { users: PeopleUser[] }; meta?: { totalPages: number; page: number } }>(
        `/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`
      )
      const data = res as unknown as { users?: PeopleUser[]; meta?: { totalPages: number; page: number } }
      setResults(data.users ?? [])
      setHasNext(data.meta ? data.meta.page < data.meta.totalPages : false)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [search, page])

  return (
    <div className="space-y-6">
      <PageHeader title="People" description="Find other members on Moistello." />

      <div className="mx-auto max-w-xl">
        <div className="flex gap-2">
          <Input
            placeholder="Search by name or wallet address..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearched(false) }}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); handleSearch() }}}
          />
          <Button variant="primary" size="md" onClick={() => { setPage(1); handleSearch() }} isLoading={loading}>
            Search
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {loading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-premium rounded-xl p-4 flex items-center gap-3">
                <Skeleton variant="circular" className="h-10 w-10" />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" className="h-4 w-32" />
                <Skeleton variant="text" className="h-3 w-48" />
              </div>
            </div>
          ))}

          {!loading && searched && results.length === 0 && (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No members found"
              description="Try a different search term or wallet address."
            />
          )}

          {!loading && results.map((u) => (
            <Link key={u.id} href={`/people/${u.id}`}>
              <div className="glass-premium rounded-xl p-4 flex items-center gap-3 hover:glass-strong transition-all cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg text-white font-mono text-sm font-bold">
                  {u.displayName?.charAt(0)?.toUpperCase() ?? u.walletAddress.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {u.displayName ?? "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {u.walletAddress.slice(0, 8)}...{u.walletAddress.slice(-4)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="default" size="sm">
                    Score: {u.moiScore}
                  </Badge>
                  {u.id === currentUser?.id && (
                    <span className="text-2xs text-muted-foreground">You</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {hasNext && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" size="md" onClick={() => setPage((p) => p + 1)}>
              Load More
            </Button>
          </div>
        )}

        {!searched && !loading && (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Search for members"
            description="Enter a name or wallet address to find other people on Moistello."
          />
        )}
      </div>
    </div>
  )
}

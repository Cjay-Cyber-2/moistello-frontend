"use client"

import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import type { ApiResponse, Contribution } from "@/types"

interface ContributionFilters {
  search?: string
  circleId?: string
  amount?: string
  date?: string
  sort?: string
  page?: number
  limit?: number
}

export function useContributions(filters?: ContributionFilters) {
  return useQuery({
    queryKey: [
      "contributions",
      filters?.search ?? "",
      filters?.circleId ?? "",
      filters?.amount ?? "",
      filters?.date ?? "",
      filters?.sort ?? "",
      filters?.page,
      filters?.limit,
    ],
    queryFn: async () => {
      const page = filters?.page ?? 1
      const limit = filters?.limit ?? 20
      const params = new URLSearchParams()
      if (filters?.search) params.set("search", filters.search)
      if (filters?.circleId) params.set("circleId", filters.circleId)
      if (filters?.amount) params.set("amount", filters.amount)
      if (filters?.date) params.set("date", filters.date)
      if (filters?.sort) params.set("sort", filters.sort)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const response = await get<
        ApiResponse<{
          contributions: Contribution[]
          summary?: {
            totalContributed: number
            average: number
            count: number
          }
        }>
      >(`/contributions?${params.toString()}`)

      return {
        contributions: response.data?.contributions ?? [],
        summary: response.data?.summary ?? null,
        meta: response.meta ?? { page, limit, total: 0, totalPages: 0 },
      }
    },
  })
}

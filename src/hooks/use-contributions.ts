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
  /** When set, react-query will re-fetch at this interval (ms). */
  refetchInterval?: number | false
}

export function useContributions(filters?: ContributionFilters) {
  const { refetchInterval, ...filterParams } = filters ?? {}

  return useQuery({
    queryKey: [
      "contributions",
      filterParams.search ?? "",
      filterParams.circleId ?? "",
      filterParams.amount ?? "",
      filterParams.date ?? "",
      filterParams.sort ?? "",
      filterParams.page,
      filterParams.limit,
    ],
    ...(refetchInterval !== undefined ? { refetchInterval } : {}),
    queryFn: async () => {
      const page = filterParams.page ?? 1
      const limit = filterParams.limit ?? 20
      const params = new URLSearchParams()
      if (filterParams.search) params.set("search", filterParams.search)
      if (filterParams.circleId) params.set("circleId", filterParams.circleId)
      if (filterParams.amount) params.set("amount", filterParams.amount)
      if (filterParams.date) params.set("date", filterParams.date)
      if (filterParams.sort) params.set("sort", filterParams.sort)
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

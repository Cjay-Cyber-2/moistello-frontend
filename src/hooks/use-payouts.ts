"use client"

import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { ApiResponse, Payout } from "@/types"

interface PayoutFilters {
  page?: number
  limit?: number
  sortBy?: "createdAt" | "amount" | "roundNumber"
  sortDir?: "asc" | "desc"
  circleId?: string
  payoutType?: Payout["payoutType"] | "all"
  dateFrom?: string
  dateTo?: string
  /** When set, react-query will re-fetch at this interval (ms). */
  refetchInterval?: number | false
}

interface PayoutQueryResult {
  payouts: Payout[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function buildPayoutQueryResult(
  response: ApiResponse<{ payouts: Payout[] }>,
  page: number,
  limit: number,
): PayoutQueryResult {
  return {
    payouts: response.data?.payouts ?? [],
    meta: response.meta ?? { page, limit, total: 0, totalPages: 0 },
  }
}

export function usePayouts(filters?: PayoutFilters) {
  const { refetchInterval, ...filterParams } = filters ?? {}
  return useQuery({
    queryKey: queryKeys.payouts.list(filterParams),
    ...(refetchInterval !== undefined ? { refetchInterval } : {}),
    queryFn: async () => {
      const page = filterParams.page ?? 1
      const limit = filterParams.limit ?? 20
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      if (filterParams.sortBy) params.set("sortBy", filterParams.sortBy)
      if (filterParams.sortDir) params.set("sortDir", filterParams.sortDir)
      if (filterParams.circleId) params.set("circleId", filterParams.circleId)
      if (filterParams.payoutType && filterParams.payoutType !== "all") {
        params.set("payoutType", filterParams.payoutType)
      }
      if (filterParams.dateFrom) params.set("dateFrom", filterParams.dateFrom)
      if (filterParams.dateTo) params.set("dateTo", filterParams.dateTo)

      const response = await get<ApiResponse<{ payouts: Payout[] }>>(
        `/payouts?${params.toString()}`,
      )

      return buildPayoutQueryResult(response, page, limit)
    },
  })
}

export function useCirclePayouts(circleId: string, filters?: PayoutFilters) {
  return useQuery({
    queryKey: queryKeys.payouts.forCircle(circleId, filters),
    queryFn: async () => {
      const page = filters?.page ?? 1
      const limit = filters?.limit ?? 5
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))

      const response = await get<ApiResponse<{ payouts: Payout[] }>>(
        `/circles/${circleId}/payouts?${params.toString()}`,
      )

      return buildPayoutQueryResult(response, page, limit)
    },
    enabled: !!circleId,
  })
}

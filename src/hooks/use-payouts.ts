"use client"

import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import type { ApiResponse, Payout } from "@/types"

interface PayoutFilters {
  page?: number
  limit?: number
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
  return useQuery({
    queryKey: ["payouts", filters?.page, filters?.limit],
    queryFn: async () => {
      const page = filters?.page ?? 1
      const limit = filters?.limit ?? 20
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))

      const response = await get<ApiResponse<{ payouts: Payout[] }>>(
        `/payouts?${params.toString()}`,
      )

      return buildPayoutQueryResult(response, page, limit)
    },
  })
}

export function useCirclePayouts(circleId: string, filters?: PayoutFilters) {
  return useQuery({
    queryKey: ["circle-payouts", circleId, filters?.page, filters?.limit],
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

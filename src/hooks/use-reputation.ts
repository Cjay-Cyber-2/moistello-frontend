"use client"

import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { ApiResponse, MoiScore } from "@/types"

// GET /users/:id/reputation is specified in BUILD-PLAN.md, but a working
// backend implementation is not confirmed in this codebase as of this PR.
export function useReputation(userId: string) {
  return useQuery({
    queryKey: queryKeys.reputation.detail(userId),
    queryFn: async () => {
      const response = await get<ApiResponse<{ reputation: MoiScore }>>(
        `/users/${userId}/reputation`,
      )
      return response.data?.reputation ?? null
    },
    enabled: !!userId,
  })
}

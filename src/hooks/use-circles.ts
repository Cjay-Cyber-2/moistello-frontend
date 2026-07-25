"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";
import {
  ApiResponse,
  Circle,
  CircleMember,
  CircleRound,
  Contribution,
} from "@/types";

interface CircleFilters {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  organizerId?: string;
}

interface CreateCirclePayload {
  name: string;
  description?: string;
  communityId?: string;
  circleType: string;
  payoutType: string;
  contributionAmount: number;
  currency: string;
  frequency: string;
  maxMembers: number;
  minMoiScore?: number;
  collateralPercent?: number;
  lateFeePercent: number;
  gracePeriodHours: number;
  maxStrikes: number;
  startDate: string;
  requiresInvite?: boolean;
}

interface JoinCirclePayload {
  userId?: string;
}

interface ContributePayload {
  amount: number;
  roundNumber?: number;
}

function normalizeCircle(c: Record<string, unknown>): Circle {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(c)) {
    // Convert sql.NullString {String, Valid} → raw string or null
    if (val && typeof val === "object" && "Valid" in val && "String" in val) {
      out[key] = (val as { String: string }).String || null
    } else if (val && typeof val === "object" && "Valid" in val && "Time" in val) {
      // Convert sql.NullTime {Time, Valid} → ISO string or null
      out[key] = (val as { Time: string }).Time || null
    } else {
      out[key] = val
    }
  }
  return out as unknown as Circle
}

export function useCircles(filters?: CircleFilters) {
  return useQuery({
    queryKey: ["circles", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.organizerId) params.set("organizerId", filters.organizerId);

      const query = params.toString();
      const url = `/circles${query ? `?${query}` : ""}`;
      const response = await get<ApiResponse<{ circles: Circle[] }>>(url);

      return {
        circles: (response.data?.circles ?? []).map((c: unknown) => normalizeCircle(c as Record<string, unknown>)),
        meta: response.meta ?? {
          page: filters?.page ?? 1,
          limit: filters?.limit ?? 20,
          total: 0,
          totalPages: 0,
        },
      };
    },
  });
}

export function useCircle(id: string) {
  return useQuery({
    queryKey: ["circle", id],
    queryFn: async () => {
      const response = await get<ApiResponse<{ circle: Circle }>>(`/circles/${id}`);
      const raw = response.data?.circle
      return raw ? normalizeCircle(raw as unknown as Record<string, unknown>) : null;
    },
    enabled: !!id,
  });
}

export function useStartCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (circleId: string) =>
      post<ApiResponse<{ success: boolean }>>(`/circles/${circleId}/start`),
    onSuccess: (_data, circleId) => {
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}

export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCirclePayload) =>
      post<ApiResponse<Circle>>("/circles", payload, { _retry: true } as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}

export function useJoinCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      circleId,
      payload,
    }: {
      circleId: string;
      payload?: JoinCirclePayload;
    }) => post<ApiResponse<CircleMember>>(`/circles/${circleId}/join`, payload ?? {}),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["circle", variables.circleId] });
      queryClient.invalidateQueries({ queryKey: ["circle-members", variables.circleId] });
    },
  });
}

export function useContribute(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContributePayload) =>
      post<ApiResponse<Contribution>>(
        `/circles/${circleId}/contribute`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circle-rounds", circleId] });
    },
  });
}

export function useCircleMembers(circleId: string) {
  return useQuery({
    queryKey: ["circle-members", circleId],
    queryFn: async () => {
      const response = await get<ApiResponse<{ members: CircleMember[] }>>(
        `/circles/${circleId}/members`
      );
      return response.data?.members ?? [];
    },
    enabled: !!circleId,
  });
}

export function useCircleRounds(circleId: string) {
  return useQuery({
    queryKey: ["circle-rounds", circleId],
    queryFn: async () => {
      const response = await get<
        ApiResponse<{
          rounds: CircleRound[]
          currentRound: number
          totalMembers: number
        }>
      >(
        `/circles/${circleId}/rounds`
      );
      return response.data?.rounds ?? [];
    },
    enabled: !!circleId,
  });
}

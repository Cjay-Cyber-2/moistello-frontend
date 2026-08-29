"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, Notification } from "@/types";

function computeUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

async function fetchNotifications(): Promise<Notification[]> {
  const response = await get<
    ApiResponse<{ notifications: Notification[] }>
  >("/notifications");
  return response.data?.notifications ?? [];
}

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  );
}

function signalAuthRequired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:required"));
  }
}

/**
 * The single notification data layer. The query auto-fetches on mount for any
 * consumer (the page, the header badge, the WS provider), so there is no
 * longer a separate zustand store living outside the QueryProvider.
 */
export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: fetchNotifications,
  });
}

export function useUnreadCount() {
  const { data } = useNotificationsQuery();
  return data ? computeUnreadCount(data) : 0;
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patch(`/notifications/${id}/read`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });
      const previous = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.all
      );
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all,
        (old = []) =>
          old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          context.previous
        );
      }
      if (isUnauthorizedError(error)) signalAuthRequired();
      console.warn("[notifications] Failed to mark notification as read:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

export function useMarkAllAsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => patch("/notifications/read-all"),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });
      const previous = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.all
      );
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all,
        (old = []) => old.map((n) => ({ ...n, isRead: true }))
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          context.previous
        );
      }
      console.warn("[notifications] Failed to mark all as read:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Composite hook preserving the shape consumers already relied on, backed by
 * the react-query hooks above. `fetchNotifications` is an alias for refetch so
 * call sites that force a refresh keep working.
 */
export function useNotifications() {
  const query = useNotificationsQuery();
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  return {
    notifications: query.data ?? [],
    unreadCount: query.data ? computeUnreadCount(query.data) : 0,
    isLoading: query.isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    fetchNotifications: query.refetch,
  };
}

"use client";

import { type ReactNode, useEffect, useRef, useCallback } from "react";
import { useWebSocket, type WebSocketMessage } from "@/hooks/use-websocket";
import { useNotificationStore } from "@/stores/notification-store";
import { useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types";

interface WsProviderProps {
  children: ReactNode;
}

export function WsProvider({ children }: WsProviderProps) {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const mountedRef = useRef(true);

  const handleEventRef = useRef<(msg: WebSocketMessage) => void>(() => {});

  handleEventRef.current = (msg: WebSocketMessage) => {
    if (!mountedRef.current) return;

    const payload = msg.payload as Record<string, unknown> | undefined;
    const circleId = payload?.circleId as string | undefined;

    switch (msg.type) {
      // ── Circle events ──
      case "circle.created":
        queryClient.invalidateQueries({ queryKey: ["circles"] });
        queryClient.invalidateQueries({ queryKey: ["my-circles"] });
        break;

      case "circle.status_changed":
        if (circleId) {
          queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
        }
        queryClient.invalidateQueries({ queryKey: ["circles"] });
        break;

      case "member.joined":
      case "member.left":
        if (circleId) {
          queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
          queryClient.invalidateQueries({ queryKey: ["circle-members", circleId] });
        }
        break;

      case "contribution.recorded":
        if (circleId) {
          queryClient.invalidateQueries({ queryKey: ["circle-rounds", circleId] });
          queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
        }
        queryClient.invalidateQueries({ queryKey: ["contributions"] });
        break;

      case "payout.executed":
        if (circleId) {
          queryClient.invalidateQueries({ queryKey: ["circle-rounds", circleId] });
        }
        queryClient.invalidateQueries({ queryKey: ["payouts"] });
        break;

      // ── Community events ──
      case "community.joined":
        queryClient.invalidateQueries({ queryKey: ["communities"] });
        break;

      // ── Notification events ──
      case "notification.new":
      case "notification":
      case "new_notification":
        addNotification(msg.payload as unknown as Notification);
        fetchNotifications();
        break;

      // ── User events ──
      case "user.updated":
        queryClient.invalidateQueries({ queryKey: ["auth"] });
        break;

      default:
        break;
    }
  };

  const handleEvent = useCallback((msg: WebSocketMessage) => {
    handleEventRef.current(msg);
  }, []);

  useWebSocket({ onEvent: handleEvent });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return <>{children}</>;
}

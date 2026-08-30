"use client";

import { useContributions } from "@/hooks/use-contributions";
import { useWsState } from "@/hooks/use-ws-state";
import type { WsConnectionState } from "@/hooks/use-websocket";

type ContributionsOptions = Parameters<typeof useContributions>[0];

/**
 * Extends `useContributions` with live-update awareness.
 *
 * - When connected: data is refreshed in real-time by WsProvider's cache
 *   invalidation on `contribution.recorded` events.
 * - When disconnected: react-query polls every 30 seconds as a fallback.
 *
 * Returns all fields from `useContributions` plus:
 * - `isLive`          — true when the WebSocket is connected
 * - `connectionState` — 'connected' | 'polling' | 'disconnected' | 'connecting'
 */
export function useLiveContributions(options?: ContributionsOptions) {
  const { isConnected, connectionState } = useWsState();

  const contributionsQuery = useContributions({
    ...options,
    // Fall back to polling react-query every 30 s when the WebSocket is not live
    refetchInterval: isConnected ? false : 30000,
  });

  return {
    ...contributionsQuery,
    isLive: isConnected,
    connectionState,
  };
}

export type { WsConnectionState };

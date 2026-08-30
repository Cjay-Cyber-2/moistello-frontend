"use client";

import { usePayouts } from "@/hooks/use-payouts";
import { useWsState } from "@/hooks/use-ws-state";
import type { WsConnectionState } from "@/hooks/use-websocket";

type PayoutsOptions = Parameters<typeof usePayouts>[0];

/**
 * Extends `usePayouts` with live-update awareness.
 *
 * - When connected: data is refreshed in real-time by WsProvider's cache
 *   invalidation on `payout.executed` events.
 * - When disconnected: react-query polls every 30 seconds as a fallback.
 *
 * Returns all fields from `usePayouts` plus:
 * - `isLive`          — true when the WebSocket is connected
 * - `connectionState` — 'connected' | 'polling' | 'disconnected' | 'connecting'
 */
export function useLivePayouts(options?: PayoutsOptions) {
  const { isConnected, connectionState } = useWsState();

  const payoutsQuery = usePayouts({
    ...options,
    // Fall back to polling react-query every 30 s when the WebSocket is not live
    refetchInterval: isConnected ? false : 30000,
  });

  return {
    ...payoutsQuery,
    isLive: isConnected,
    connectionState,
  };
}

export type { WsConnectionState };

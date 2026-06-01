"use client";

import { useMultiWalletStore } from "@/stores/multi-wallet-store";

export function useWallet() {
  const wallets = useMultiWalletStore((s) => s.wallets);
  const activeWalletId = useMultiWalletStore((s) => s.activeWalletId);
  const address = useMultiWalletStore((s) => s.address);
  const isConnected = useMultiWalletStore((s) => s.isConnected);
  const isConnecting = useMultiWalletStore((s) => s.isConnecting);
  const error = useMultiWalletStore((s) => s.error);
  const connect = useMultiWalletStore((s) => s.connect);
  const disconnect = useMultiWalletStore((s) => s.disconnect);
  const refreshBalance = useMultiWalletStore((s) => s.refreshBalance);

  const activeEntry = activeWalletId ? wallets[activeWalletId] : null;
  const balance = activeEntry?.balance ?? null;

  return {
    address,
    isConnected,
    balance,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshBalance,
  };
}

"use client"

import { useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Wallet, Loader2, Shield } from "lucide-react"
import { WalletGrid } from "./wallet-grid"
import type { ReactNode } from "react"

const AuthConnectionState = dynamic(
  () => import("./auth-connection-state").then((m) => m.AuthConnectionState),
  { ssr: false }
)

interface DetectedWallet {
  id: string
  name: string
  category: string
  icon: ReactNode
  description: string
  isRecommended?: boolean
  installUrl?: string
  status?: "detected" | "not_detected"
}

interface ChooseWalletStepProps {
  mode: "login" | "register"
  wallets: DetectedWallet[]
  isScanning: boolean
  connectingWalletId: string | null
  wc2PairingUri: string | null
  wc2PairingState: string
  wc2PairingError: string | null
  wc2QrExpiresAt: number | null
  onSelectWallet: (walletId: string) => void
  onWc2Cancel: () => void
  onWc2Retry: () => void
  onPasskeyLogin?: () => void
}

export function ChooseWalletStep({
  mode,
  wallets,
  isScanning,
  connectingWalletId,
  wc2PairingUri,
  wc2PairingState,
  wc2PairingError,
  wc2QrExpiresAt,
  onSelectWallet,
  onWc2Cancel,
  onWc2Retry,
  onPasskeyLogin,
}: ChooseWalletStepProps) {
  const isWc2Active = wc2PairingState !== "idle" && wc2PairingState !== "approved"

  const handleSelect = useCallback(
    (walletId: string) => {
      if (connectingWalletId) return
      onSelectWallet(walletId)
    },
    [connectingWalletId, onSelectWallet]
  )

  const hasPasskey = useMemo(() => {
    return wallets.some((w) => w.id === "passkey" && w.status === "detected")
  }, [wallets])

  if (isWc2Active) {
    return (
      <div className="space-y-4">
        <AuthConnectionState
          pairingUri={wc2PairingUri}
          pairingState={wc2PairingState as "idle" | "pairing" | "awaiting_approval" | "approved" | "rejected" | "timeout" | "error"}
          error={wc2PairingError}
          onRetry={onWc2Retry}
          onCancel={onWc2Cancel}
          expiresAt={wc2QrExpiresAt}
        />
      </div>
    )
  }

  if (isScanning) {
    return (
      <div className="flex flex-col items-center gap-4 py-8" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-aurora-violet" />
        <p className="text-sm text-muted-foreground">Detecting wallets...</p>
      </div>
    )
  }

  const extensions = wallets.filter((w) => w.category === "extension" || w.category === "mobile")
  const hardware = wallets.filter((w) => w.category === "hardware")
  const passkeyWallet = wallets.find((w) => w.id === "passkey")

  return (
    <div className="space-y-4">
      {passkeyWallet && (
        <div className="space-y-3">
          {mode === "login" && hasPasskey && onPasskeyLogin && (
            <button
              type="button"
              onClick={onPasskeyLogin}
              className="w-full flex items-center gap-3 rounded-xl holo-border px-4 py-3 text-left transition-all hover:bg-white/[0.06]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora-violet/20 text-aurora-violet">
                <Shield className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Sign in with Passkey</p>
                  <span className="text-2xs rounded-full bg-emerald-500/20 px-1.5 py-0.5 font-medium text-emerald-400">
                    Detected
                  </span>
                </div>
                <p className="mt-0.5 text-2xs text-muted-foreground">{passkeyWallet.description}</p>
              </div>
            </button>
          )}

          {mode === "register" && (
            <button
              type="button"
              onClick={() => handleSelect("passkey")}
              disabled={!!connectingWalletId}
              className="w-full flex items-center gap-3 rounded-xl holo-border px-4 py-3 text-left transition-all hover:bg-white/[0.06] disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora-violet/20 text-aurora-violet">
                <Shield className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Passkey</p>
                  <span className="text-2xs rounded-full bg-aurora-violet/20 px-1.5 py-0.5 font-medium text-aurora-violet">
                    Recommended
                  </span>
                </div>
                <p className="mt-0.5 text-2xs text-muted-foreground">
                  {passkeyWallet?.description ?? "Fast, secure, no password needed"}
                </p>
              </div>
              {connectingWalletId === "passkey" && (
                <Loader2 className="h-4 w-4 animate-spin text-aurora-violet shrink-0" />
              )}
            </button>
          )}
        </div>
      )}

      {extensions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground text-center">
            Or connect with a wallet
          </p>
          <WalletGrid
            wallets={extensions}
            connectingWalletId={connectingWalletId}
            onSelect={handleSelect}
          />
        </div>
      )}

      {extensions.length === 0 && !passkeyWallet && !isScanning && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Wallet className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground text-center">
            No wallets detected. Install a Stellar wallet like{" "}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aurora-cyan hover:underline"
            >
              Freighter
            </a>
            {" "}or use WalletConnect.
          </p>
        </div>
      )}

      {hardware.length > 0 && (
        <div className="space-y-2">
          {hardware.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleSelect(w.id)}
              disabled={!!connectingWalletId}
              className="w-full flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left transition-all hover:border-aurora-violet/40 hover:bg-white/[0.06] disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-premium-gold/20 text-premium-gold">
                {w.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{w.name}</p>
                  <span className="text-2xs rounded-full bg-premium-gold/20 px-1.5 py-0.5 font-medium text-premium-gold">
                    Hardware
                  </span>
                </div>
                <p className="mt-0.5 text-2xs text-muted-foreground">{w.description}</p>
              </div>
              {connectingWalletId === w.id && (
                <Loader2 className="h-4 w-4 animate-spin text-aurora-violet shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

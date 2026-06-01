"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useAuthFlow, AuthFlowProvider } from "@/hooks/auth-flow-context"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
import { useUIStore } from "@/stores/ui-store"
import { useSignMessage } from "@/hooks/use-sign-message"
import { useEmailVerification } from "@/hooks/use-email-verification"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { useConditionalMediation } from "@/hooks/use-conditional-mediation"
import { recordMetric } from "@/lib/monitoring"
import { passkeyEmailStore } from "@/lib/passkey/login-email-store"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ChooseWalletStep } from "@/components/auth/choose-wallet-step"
import { VerifyEmailStep } from "@/components/auth/verify-email-step"
import { SignStep } from "@/components/auth/sign-step"
import { LoadingOverlay } from "@/components/auth/loading-overlay"
import { SessionTimeoutBanner } from "@/components/auth/session-timeout-banner"
import { PasskeyRevokedBanner } from "@/components/auth/passkey-revoked-banner"

const LedgerPrompt = dynamic(
  () => import("@/components/wallet/ledger-prompt").then((m) => m.LedgerPrompt),
  { ssr: false }
)

function LoginPageContent() {
  const router = useRouter()
  useRedirectIfAuthenticated()
  useConditionalMediation()

  const step = useAuthFlow((s) => s.step)
  const status = useAuthFlow((s) => s.status)
  const error = useAuthFlow((s) => s.error)
  const connection = useAuthFlow((s) => s.connection)
  const auth = useAuthFlow((s) => s.auth)
  const mode = useAuthFlow((s) => s.mode)
  const rateLimit = useAuthFlow((s) => s.rateLimit)
  const passkeyRevoked = useAuthFlow((s) => s.passkeyRevoked)

  const startLoginFlow = useAuthFlow((s) => s.startLoginFlow)
  const connectStart = useAuthFlow((s) => s.connectStart)
  const connectSuccess = useAuthFlow((s) => s.connectSuccess)
  const setStep = useAuthFlow((s) => s.setStep)
  const setError = useAuthFlow((s) => s.setError)
  const goBack = useAuthFlow((s) => s.goBack)

  const detectedWallets = useMultiWalletStore((s) => s.detectedWallets)
  const isScanning = useMultiWalletStore((s) => s.isScanning)
  const connect = useMultiWalletStore((s) => s.connect)
  const wc2PairingUri = useMultiWalletStore((s) => s.wc2PairingUri)
  const wc2PairingState = useMultiWalletStore((s) => s.wc2PairingState)
  const wc2PairingError = useMultiWalletStore((s) => s.wc2PairingError)
  const wc2QrExpiresAt = useMultiWalletStore((s) => s.wc2QrExpiresAt)
  const setWc2PairingUri = useMultiWalletStore((s) => s.setWc2PairingUri)
  const setWc2PairingState = useMultiWalletStore((s) => s.setWc2PairingState)
  const clearLoginError = useMultiWalletStore((s) => s.clearLoginError)
  const resetWc2Pairing = useMultiWalletStore((s) => s.resetWc2Pairing)

  const { sign } = useSignMessage()
  const { emailVerification, sendCode, verifyCode: verifyEmailCode, resendCode } = useEmailVerification()

  const addToast = useUIStore((s) => s.addToast)
  const [showLedgerPrompt, setShowLedgerPrompt] = useState(false)

  const passkeyLoginAttemptedRef = useRef(false)

  useEffect(() => {
    useMultiWalletStore.getState().scanWallets()
    clearLoginError()
    resetWc2Pairing()
  }, [clearLoginError, resetWc2Pairing])

  useEffect(() => {
    if (mode !== "login") startLoginFlow()
  }, [mode, startLoginFlow])

  const handlePasskeyLogin = useCallback(() => {
    recordMetric("auth.flow.started", 1, { mode: "login", method: "passkey" })
    const savedEmail = passkeyEmailStore.get()
    if (savedEmail) {
      useAuthFlowStore.getState().sendVerificationCode(savedEmail)
    }
    setStep("verify-email")
  }, [setStep])

  useEffect(() => {
    if (step !== "verify-email" || !emailVerification.codeVerified || passkeyLoginAttemptedRef.current) return

    passkeyLoginAttemptedRef.current = true

    const doPasskeyAuth = async () => {
      const store = useAuthFlowStore.getState()
      const mwState = useMultiWalletStore.getState()

      passkeyEmailStore.save(emailVerification.email)
      store.connectStart("passkey")

      try {
        await mwState.connect("passkey")
        const updatedMw = useMultiWalletStore.getState()
        const address = updatedMw.address
        if (address) {
          store.connectSuccess("passkey", address)
          const authStatus = useAuthFlowStore.getState().status.status
          if (authStatus !== "authenticated") {
            await useAuthFlowStore.getState().signAndSubmit()
          }
          const finalStatus = useAuthFlowStore.getState().status.status
          if (finalStatus === "authenticated") {
            addToast({
              type: "success",
              title: "Welcome back!",
              description: "You are now signed in.",
            })
            router.replace("/dashboard")
          }
        } else {
          const msg = "Could not retrieve passkey address."
          store.setError("connection_rejected", msg)
          addToast({ type: "error", title: "Passkey Login Failed", description: msg })
        }
      } catch {
        const msg = "Passkey authentication failed."
        store.setError("connection_rejected", msg)
        addToast({ type: "error", title: "Passkey Login Failed", description: msg })
      }
    }

    doPasskeyAuth()
  }, [step, emailVerification.codeVerified, emailVerification.email, router, addToast])

  const handleSelectWallet = useCallback(
    async (walletId: string) => {
      const wallet = detectedWallets.find((w) => w.id === walletId)

      if (wallet?.category === "hardware") {
        setShowLedgerPrompt(true)
        recordMetric("auth.flow.started", 1, { mode: "login", method: walletId })
        return
      }

      connectStart(walletId)

      if (walletId === "walletconnect") {
        try {
          const { setOnPairingUri } = await import("@/lib/wallet/adapters/walletconnect")
          setOnPairingUri((uri: string) => {
            setWc2PairingUri(uri)
            setWc2PairingState("awaiting_approval")
          })
        } catch {
          setError("connection_rejected", "Failed to initialize WalletConnect")
          addToast({ type: "error", title: "WalletConnect Failed", description: "Failed to initialize WalletConnect" })
          return
        }
      }

      try {
        recordMetric("wallet.connect.attempt", 1, { walletId, mode: "login" })
        await connect(walletId)
        const address = useMultiWalletStore.getState().address
        if (address) {
          connectSuccess(walletId, address)
          setStep("sign")
        }
      } catch {
        if (walletId === "walletconnect") {
          setWc2PairingState("rejected")
        }
        const msg = "Connection was cancelled or failed."
        setError("connection_rejected", msg)
        addToast({ type: "error", title: "Connection Failed", description: msg })
      } finally {
        if (walletId === "walletconnect") {
          import("@/lib/wallet/adapters/walletconnect").then(({ setOnPairingUri }) => {
            setOnPairingUri(null)
          })
        }
      }
    },
    [detectedWallets, connectStart, connect, connectSuccess, setStep, setError, setWc2PairingUri, setWc2PairingState, addToast]
  )

  const handleLedgerConnected = useCallback(
    (publicKey: string) => {
      connectStart("ledger")
      connectSuccess("ledger", publicKey)
      setStep("sign")
      setShowLedgerPrompt(false)
      addToast({
        type: "success",
        title: "Ledger Connected",
        description: `Connected with address ${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`,
      })
    },
    [connectStart, connectSuccess, setStep, addToast]
  )

  const handleWc2Cancel = useCallback(() => {
    resetWc2Pairing()
    const walletId = connection.walletId
    if (walletId) {
      useMultiWalletStore.getState().disconnect(walletId)
    }
  }, [connection.walletId, resetWc2Pairing])

  const handleWc2Retry = useCallback(() => {
    resetWc2Pairing()
    setStep("choose")
  }, [resetWc2Pairing, setStep])

  const handleSignSubmit = useCallback(async () => {
    await sign()
    const authStatus = useAuthFlowStore.getState().status.status
    if (authStatus === "authenticated") {
      addToast({
        type: "success",
        title: "Welcome back!",
        description: "You are now signed in.",
      })
      router.replace("/dashboard")
    }
  }, [sign, router, addToast])

  const wallets = useMemo(
    () =>
      detectedWallets.map((w) => ({
        id: w.id,
        name: w.name,
        category: w.category,
        icon: <span>{w.icon || w.name.charAt(0)}</span>,
        description: w.description,
        isRecommended: w.id === "walletconnect",
        installUrl: w.installUrl,
        status: w.status as "detected" | "not_detected",
      })),
    [detectedWallets]
  )

  if (status.status === "authenticated") {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 py-8" role="status" aria-live="polite">
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <>
      <AuthLayout
        footerLinks={[
          { label: "Don't have an account? ", href: "/register", text: "Create one" },
          { label: "", href: "/", text: "\u2190 Back to home" },
        ]}
      >
        <SessionTimeoutBanner />
        {passkeyRevoked && <PasskeyRevokedBanner />}

        {(status.status === "connecting" || status.status === "signing") && (
          <LoadingOverlay
            isVisible
            text={
              status.status === "signing"
                ? "Signing you in..."
                : "Connecting your wallet..."
            }
          />
        )}

        {step === "choose" || status.status === "connected" ? (
          <ChooseWalletStep
            mode="login"
            wallets={wallets}
            isScanning={isScanning}
            connectingWalletId={connection.walletId}
            wc2PairingUri={wc2PairingUri}
            wc2PairingState={wc2PairingState}
            wc2PairingError={wc2PairingError}
            wc2QrExpiresAt={wc2QrExpiresAt}
            onSelectWallet={handleSelectWallet}
            onWc2Cancel={handleWc2Cancel}
            onWc2Retry={handleWc2Retry}
            onPasskeyLogin={handlePasskeyLogin}
          />
        ) : step === "verify-email" ? (
          <VerifyEmailStep
            emailVerification={emailVerification}
            status={status}
            error={error}
            onSendCode={sendCode}
            onVerifyCode={verifyEmailCode}
            onResend={resendCode}
            onBack={goBack}
          />
        ) : step === "sign" ? (
          <SignStep
            mode="login"
            connection={connection}
            profile={{ displayName: "", email: "", countryCode: "", language: "en" }}
            auth={auth}
            status={status}
            error={error}
            rateLimit={rateLimit}
            onSign={handleSignSubmit}
            onBack={() => setStep("choose")}
          />
        ) : null}
      </AuthLayout>

      <LedgerPrompt
        isOpen={showLedgerPrompt}
        onClose={() => setShowLedgerPrompt(false)}
        onConnected={handleLedgerConnected}
      />
    </>
  )
}

export default function LoginPage() {
  return (
    <AuthFlowProvider>
      <LoginPageContent />
    </AuthFlowProvider>
  )
}

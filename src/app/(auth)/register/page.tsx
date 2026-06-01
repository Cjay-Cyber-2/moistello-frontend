"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthFlow, AuthFlowProvider } from "@/hooks/auth-flow-context"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
import { useEmailVerification } from "@/hooks/use-email-verification"
import { useSignMessage } from "@/hooks/use-sign-message"
import { useProfileForm } from "@/hooks/use-profile-form"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthStepIndicator } from "@/components/auth/auth-step-indicator"
import { ChooseWalletStep } from "@/components/auth/choose-wallet-step"
import { VerifyEmailStep } from "@/components/auth/verify-email-step"
import { ProfileStep } from "@/components/auth/profile-step"
import { SignStep } from "@/components/auth/sign-step"
import { SessionTimeoutBanner } from "@/components/auth/session-timeout-banner"
import { PasskeyRevokedBanner } from "@/components/auth/passkey-revoked-banner"

const STEPS = [
  { key: "choose", label: "Choose", number: 1 },
  { key: "verify-email", label: "Verify", number: 2 },
  { key: "profile", label: "Profile", number: 3 },
  { key: "sign", label: "Sign", number: 4 },
]

function RegisterPageContent() {
  const router = useRouter()
  useRedirectIfAuthenticated()

  const step = useAuthFlow((s) => s.step)
  const status = useAuthFlow((s) => s.status)
  const error = useAuthFlow((s) => s.error)
  const connection = useAuthFlow((s) => s.connection)
  const auth = useAuthFlow((s) => s.auth)
  const mode = useAuthFlow((s) => s.mode)
  const rateLimit = useAuthFlow((s) => s.rateLimit)
  const passkeyRevoked = useAuthFlow((s) => s.passkeyRevoked)
  const startRegisterFlow = useAuthFlow((s) => s.startRegisterFlow)
  const connectStart = useAuthFlow((s) => s.connectStart)
  const connectSuccess = useAuthFlow((s) => s.connectSuccess)
  const setStep = useAuthFlow((s) => s.setStep)
  const goBack = useAuthFlow((s) => s.goBack)
  const setError = useAuthFlow((s) => s.setError)

  const detectedWallets = useMultiWalletStore((s) => s.detectedWallets)
  const isScanning = useMultiWalletStore((s) => s.isScanning)
  const connect = useMultiWalletStore((s) => s.connect)
  const wc2PairingUri = useMultiWalletStore((s) => s.wc2PairingUri)
  const wc2PairingState = useMultiWalletStore((s) => s.wc2PairingState)
  const wc2PairingError = useMultiWalletStore((s) => s.wc2PairingError)
  const wc2QrExpiresAt = useMultiWalletStore((s) => s.wc2QrExpiresAt)
  const setWc2PairingUri = useMultiWalletStore((s) => s.setWc2PairingUri)
  const setWc2PairingState = useMultiWalletStore((s) => s.setWc2PairingState)
  const resetWc2Pairing = useMultiWalletStore((s) => s.resetWc2Pairing)

  const { emailVerification, sendCode, verifyCode: verifyEmailCode, resendCode } = useEmailVerification()
  const { sign } = useSignMessage()
  const { profile, updateField, setFieldError } = useProfileForm()

  useEffect(() => {
    if (mode !== "register") startRegisterFlow()
  }, [mode, startRegisterFlow])

  const handleSelectWallet = useCallback(
    async (walletId: string) => {
      connectStart(walletId)

      if (walletId === "walletconnect") {
        try {
          const { setOnPairingUri } = await import("@/lib/wallet/adapters/walletconnect")
          setOnPairingUri((uri: string) => {
            setWc2PairingUri(uri)
          })
        } catch {
          setError("connection_rejected", "Failed to initialize WalletConnect")
          return
        }
      }

      if (walletId === "passkey") {
        setStep("verify-email")
        return
      }

      try {
        await connect(walletId)
        const address = useMultiWalletStore.getState().address
        if (address) {
          connectSuccess(walletId, address)
          setStep("profile")
        }
      } catch {
        if (walletId === "walletconnect") {
          setWc2PairingState("rejected")
        }
        setError("connection_rejected", "Connection was cancelled or failed.")
      }
    },
    [connectStart, connect, connectSuccess, setStep, setError, setWc2PairingUri, setWc2PairingState]
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

  const handleProfileSubmit = useCallback(() => {
    setStep("sign")
  }, [setStep])

  const handleSignSubmit = useCallback(async () => {
    await sign()
    const authStatus = useAuthFlowStore.getState().status.status
    if (authStatus === "authenticated") {
      router.replace("/dashboard")
    }
  }, [sign, router])

  const wallets = useMemo(
    () =>
      detectedWallets.map((w) => ({
        id: w.id,
        name: w.name,
        category: w.category,
        icon: <span>{w.icon || w.name.charAt(0)}</span>,
        description: w.description,
        isRecommended: w.id === "passkey",
        installUrl: w.installUrl,
        status: w.status as "detected" | "not_detected",
      })),
    [detectedWallets]
  )

  return (
    <AuthLayout
      footerLinks={[
        { label: "Already have an account? ", href: "/login", text: "Sign in" },
        { label: "", href: "/", text: "\u2190 Back to home" },
      ]}
    >
      <AuthStepIndicator steps={STEPS} currentStep={step} className="mb-6" />

      <SessionTimeoutBanner />
      {passkeyRevoked && <PasskeyRevokedBanner />}

      {step === "choose" && (
        <ChooseWalletStep
          mode="register"
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
        />
      )}

      {step === "verify-email" && (
        <VerifyEmailStep
          emailVerification={emailVerification}
          status={status}
          error={error}
          onSendCode={sendCode}
          onVerifyCode={verifyEmailCode}
          onResend={resendCode}
          onBack={goBack}
        />
      )}

      {step === "profile" && (
        <ProfileStep
          profile={profile}
          onUpdateField={updateField}
          onSetFieldError={setFieldError}
          onBack={goBack}
          onSubmit={handleProfileSubmit}
        />
      )}

      {step === "sign" && (
        <SignStep
          mode="register"
          connection={connection}
          profile={profile}
          auth={auth}
          status={status}
          error={error}
          rateLimit={rateLimit}
          onSign={handleSignSubmit}
          onBack={goBack}
        />
      )}

      {status.status === "authenticated" && (
        <div className="flex flex-col items-center gap-4 py-4" role="status" aria-live="polite">
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      )}
    </AuthLayout>
  )
}

export default function RegisterPage() {
  return (
    <AuthFlowProvider>
      <RegisterPageContent />
    </AuthFlowProvider>
  )
}

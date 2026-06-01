"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ArrowLeft, Fingerprint, Loader2, Shield } from "lucide-react"
import { useAuthFlow, AuthFlowProvider } from "@/hooks/auth-flow-context"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
import { useUIStore } from "@/stores/ui-store"
import { useEmailVerification } from "@/hooks/use-email-verification"
import { useSignMessage } from "@/hooks/use-sign-message"
import { useProfileForm } from "@/hooks/use-profile-form"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { useConditionalMediation } from "@/hooks/use-conditional-mediation"
import { recordMetric } from "@/lib/monitoring"
import { getWalletIcon } from "@/lib/wallet/wallet-icons"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthStepIndicator } from "@/components/auth/auth-step-indicator"
import { ChooseWalletStep } from "@/components/auth/choose-wallet-step"
import { VerifyEmailStep } from "@/components/auth/verify-email-step"
import { ProfileStep } from "@/components/auth/profile-step"
import { SignStep } from "@/components/auth/sign-step"
import { AuthInput } from "@/components/auth/auth-input"
import { SessionTimeoutBanner } from "@/components/auth/session-timeout-banner"
import { PasskeyRevokedBanner } from "@/components/auth/passkey-revoked-banner"

const LedgerPrompt = dynamic(
  () => import("@/components/wallet/ledger-prompt").then((m) => m.LedgerPrompt),
  { ssr: false }
)

type Step = "choose" | "passkey-email" | "verify-email" | "profile" | "sign"

const STEPS = [
  { key: "choose", label: "Choose", number: 1 },
  { key: "verify-email", label: "Verify", number: 2 },
  { key: "profile", label: "Profile", number: 3 },
  { key: "sign", label: "Sign", number: 4 },
]

const PASSKEY_STEPS = [
  { key: "passkey-email", label: "Email", number: 1 },
  { key: "profile", label: "Profile", number: 2 },
  { key: "sign", label: "Sign", number: 3 },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RegisterPageContent() {
  const router = useRouter()
  useRedirectIfAuthenticated()
  useConditionalMediation()

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
  const setError = useAuthFlow((s) => s.setError)

  const detectedWallets = useMultiWalletStore((s) => s.detectedWallets)
  const isScanning = useMultiWalletStore((s) => s.isScanning)
  const connect = useMultiWalletStore((s) => s.connect)
  const wc2PairingUri = useMultiWalletStore((s) => s.wc2PairingUri)
  const wc2PairingState = useMultiWalletStore((s) => s.wc2PairingState)
  const wc2PairingError = useMultiWalletStore((s) => s.wc2PairingError)
  const wc2QrExpiresAt = useMultiWalletStore((s) => s.wc2QrExpiresAt)
  const passkeyState = useMultiWalletStore((s) => s.passkeyState)
  const setPasskeyEmail = useMultiWalletStore((s) => s.setPasskeyEmail)
  const setPasskeyPublicKey = useMultiWalletStore((s) => s.setPasskeyPublicKey)
  const setWc2PairingUri = useMultiWalletStore((s) => s.setWc2PairingUri)
  const setWc2PairingState = useMultiWalletStore((s) => s.setWc2PairingState)
  const clearRegisterError = useMultiWalletStore((s) => s.clearRegisterError)
  const resetWc2Pairing = useMultiWalletStore((s) => s.resetWc2Pairing)

  const { emailVerification, sendCode, verifyCode: verifyEmailCode, resendCode } = useEmailVerification()
  const { sign } = useSignMessage()
  const { profile, updateField, setFieldError } = useProfileForm()

  const addToast = useUIStore((s) => s.addToast)
  const [showLedgerPrompt, setShowLedgerPrompt] = useState(false)
  const [passkeyEmailInput, setPasskeyEmailInput] = useState("")
  const [passkeyEmailError, setPasskeyEmailError] = useState<string | null>(null)
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false)
  const [localStep, setLocalStep] = useState<Step>("choose")

  const effectiveStep = localStep
  const isPasskeyFlow = localStep === "passkey-email"

  useEffect(() => {
    useMultiWalletStore.getState().scanWallets()
    clearRegisterError()
    resetWc2Pairing()
  }, [clearRegisterError, resetWc2Pairing])

  useEffect(() => {
    if (mode !== "register") startRegisterFlow()
  }, [mode, startRegisterFlow])

  useEffect(() => {
    if (effectiveStep === "choose" && status.status === "connected") {
      setLocalStep("profile")
    }
  }, [effectiveStep, status])

  const handleSelectWallet = useCallback(
    async (walletId: string) => {
      const wallet = detectedWallets.find((w) => w.id === walletId)

      if (wallet?.category === "hardware") {
        setShowLedgerPrompt(true)
        recordMetric("auth.flow.started", 1, { mode: "register", method: walletId })
        return
      }

      if (walletId === "passkey") {
        setLocalStep("passkey-email")
        recordMetric("auth.flow.started", 1, { mode: "register", method: "passkey" })
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
        recordMetric("wallet.connect.attempt", 1, { walletId, mode: "register" })
        await connect(walletId)
        const address = useMultiWalletStore.getState().address
        if (address) {
          connectSuccess(walletId, address)
          setLocalStep("profile")
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
    [detectedWallets, connectStart, connect, connectSuccess, setError, setWc2PairingUri, setWc2PairingState, addToast]
  )

  const handleLedgerConnected = useCallback(
    (publicKey: string) => {
      connectStart("ledger")
      connectSuccess("ledger", publicKey)
      setLocalStep("profile")
      setShowLedgerPrompt(false)
      addToast({
        type: "success",
        title: "Ledger Connected",
        description: `Connected with address ${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`,
      })
    },
    [connectStart, connectSuccess, addToast]
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
    setLocalStep("choose")
  }, [resetWc2Pairing])

  const handlePasskeyCreate = useCallback(async () => {
    if (!passkeyEmailInput || !EMAIL_REGEX.test(passkeyEmailInput)) {
      setPasskeyEmailError("Please enter a valid email address")
      return
    }
    if (passkeyEmailInput.length > 254) {
      setPasskeyEmailError("Email must be 254 characters or fewer")
      return
    }

    setPasskeyEmailError(null)
    setIsCreatingPasskey(true)
    setPasskeyEmail(passkeyEmailInput)
    connectStart("passkey")

    try {
      recordMetric("auth.flow.started", 1, { mode: "register", method: "passkey" })
      await connect("passkey")
      const mwAddress = useMultiWalletStore.getState().address
      if (!mwAddress) {
        throw new Error("Failed to get wallet address from passkey")
      }
      setPasskeyPublicKey(mwAddress)
      connectSuccess("passkey", mwAddress)
      setLocalStep("profile")
      addToast({
        type: "success",
        title: "Passkey Created",
        description: "Your wallet is ready. Now set up your profile.",
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Passkey setup failed"
      setPasskeyEmailError(message)
      addToast({ type: "error", title: "Passkey Setup Failed", description: message })
    } finally {
      setIsCreatingPasskey(false)
    }
  }, [passkeyEmailInput, connect, setPasskeyEmail, setPasskeyPublicKey, connectStart, connectSuccess, addToast])

  const handleProfileSubmit = useCallback(() => {
    setLocalStep("sign")
  }, [])

  const handleSignSubmit = useCallback(async () => {
    await sign()
    const authStatus = useAuthFlowStore.getState().status.status
    if (authStatus === "authenticated") {
      addToast({
        type: "success",
        title: "Welcome to Moistello!",
        description: "Your account has been created.",
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
        icon: getWalletIcon({ id: w.id, name: w.name, size: "md" }),
        description: w.description,
        isRecommended: w.id === "passkey",
        installUrl: w.installUrl,
        status: w.status as "detected" | "not_detected",
      })),
    [detectedWallets]
  )

  const currentSteps = isPasskeyFlow ? PASSKEY_STEPS : STEPS
  const currentStepForIndicator = effectiveStep === "passkey-email" ? "verify-email" : effectiveStep

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
          { label: "Already have an account? ", href: "/login", text: "Sign in" },
          { label: "", href: "/", text: "\u2190 Back to home" },
        ]}
      >
        <AuthStepIndicator
          steps={currentSteps}
          currentStep={currentStepForIndicator}
          className="mb-6"
        />

        <SessionTimeoutBanner />
        {passkeyRevoked && <PasskeyRevokedBanner />}

        {effectiveStep === "choose" && (
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

        {effectiveStep === "passkey-email" && (
          <div className="space-y-6" aria-label="Passkey creation form">
            <button
              type="button"
              onClick={() => {
                setLocalStep("choose")
                setPasskeyEmailError(null)
              }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to wallet options
            </button>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg-extended">
                  <Fingerprint className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="font-heading text-lg font-medium text-foreground">Create Your Wallet</p>
              <p className="text-sm text-muted-foreground">
                Enter your email to create a passkey wallet.
                <br />
                No crypto knowledge needed.
              </p>
            </div>

            <div className="space-y-4">
              <AuthInput
                label="Email address"
                type="email"
                autoCompleteType="email"
                placeholder="you@example.com"
                value={passkeyEmailInput}
                onChange={(e) => {
                  setPasskeyEmailInput(e.target.value)
                  if (passkeyEmailError) setPasskeyEmailError(null)
                }}
                error={passkeyEmailError}
                disabled={isCreatingPasskey}
                maxLength={254}
              />

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
                  {error.message}
                </div>
              )}

              <button
                type="button"
                onClick={handlePasskeyCreate}
                disabled={!passkeyEmailInput || isCreatingPasskey}
                className="w-full h-12 rounded-xl gradient-bg-extended text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
              >
                {isCreatingPasskey ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {passkeyState === "registering" || passkeyState === "deriving"
                      ? "Creating passkey..."
                      : passkeyState === "awaiting_biometric"
                        ? "Scan biometric..."
                        : "Setting up wallet..."}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Create Passkey
                  </>
                )}
              </button>

              {isCreatingPasskey && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Your browser will ask for biometric verification
                </div>
              )}
            </div>

            <p className="text-center text-2xs text-muted-foreground">
              Your wallet is derived from your email and device biometrics.
              <br />
              No private keys leave your device.
            </p>
          </div>
        )}

        {effectiveStep === "verify-email" && (
          <VerifyEmailStep
            emailVerification={emailVerification}
            status={status}
            error={error}
            onSendCode={sendCode}
            onVerifyCode={verifyEmailCode}
            onResend={resendCode}
            onBack={() => setLocalStep("choose")}
          />
        )}

        {effectiveStep === "profile" && (
          <ProfileStep
            profile={profile}
            onUpdateField={updateField}
            onSetFieldError={setFieldError}
            onBack={() => setLocalStep("choose")}
            onSubmit={handleProfileSubmit}
          />
        )}

        {effectiveStep === "sign" && (
          <SignStep
            mode="register"
            connection={connection}
            profile={profile}
            auth={auth}
            status={status}
            error={error}
            rateLimit={rateLimit}
            onSign={handleSignSubmit}
            onBack={() => setLocalStep("profile")}
          />
        )}
      </AuthLayout>

      <LedgerPrompt
        isOpen={showLedgerPrompt}
        onClose={() => setShowLedgerPrompt(false)}
        onConnected={handleLedgerConnected}
      />
    </>
  )
}

export default function RegisterPage() {
  return (
    <AuthFlowProvider>
      <RegisterPageContent />
    </AuthFlowProvider>
  )
}

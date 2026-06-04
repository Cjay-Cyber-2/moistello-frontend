"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Fingerprint, Loader2, Shield } from "lucide-react"
import { useAuthFlow, AuthFlowProvider } from "@/hooks/auth-flow-context"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
import { useUIStore } from "@/stores/ui-store"
import { useSignMessage } from "@/hooks/use-sign-message"
import { useProfileForm } from "@/hooks/use-profile-form"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { recordMetric } from "@/lib/monitoring"
import { getWalletRegistry } from "@/lib/wallet/registry"
import { createPasskeyAdapter } from "@/lib/wallet/adapters/passkey"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthStepIndicator } from "@/components/auth/auth-step-indicator"
import { ProfileStep } from "@/components/auth/profile-step"
import { SignStep } from "@/components/auth/sign-step"
import { SessionTimeoutBanner } from "@/components/auth/session-timeout-banner"
import { PasskeyRevokedBanner } from "@/components/auth/passkey-revoked-banner"

type Step = "choose" | "profile" | "sign"

const STEPS = [
  { key: "choose", label: "Create", number: 1 },
  { key: "profile", label: "Profile", number: 2 },
  { key: "sign", label: "Sign", number: 3 },
]

getWalletRegistry().register(createPasskeyAdapter())

function RegisterPageContent() {
  const router = useRouter()
  useRedirectIfAuthenticated()

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

  const passkeyState = useMultiWalletStore((s) => s.passkeyState)
  const setPasskeyPublicKey = useMultiWalletStore((s) => s.setPasskeyPublicKey)

  const { sign } = useSignMessage()
  const { profile, updateField, setFieldError } = useProfileForm()

  const addToast = useUIStore((s) => s.addToast)
  const [localStep, setLocalStep] = useState<Step>("choose")
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false)
  const creatingPasskeyRef = useRef(false)

  const effectiveStep = localStep

  useEffect(() => {
    if (mode !== "register") startRegisterFlow()
  }, [mode, startRegisterFlow])

  useEffect(() => {
    import("@/lib/wallet/adapters/passkey").then(({ createPasskeyAdapter }) => {
      getWalletRegistry().register(createPasskeyAdapter())
    })
  }, [])

  useEffect(() => {
    if (effectiveStep === "choose" && status.status === "connected") {
      setLocalStep("profile")
    }
  }, [effectiveStep, status])

  const handlePasskeyStart = useCallback(async () => {
    if (creatingPasskeyRef.current) return
    creatingPasskeyRef.current = true
    setIsCreatingPasskey(true)
    connectStart("passkey")

    try {
      recordMetric("auth.flow.started", 1, { mode: "register", method: "passkey" })
      const adapter = getWalletRegistry().getAdapter("passkey")
      if (!adapter) throw new Error("Passkey adapter not found")
      const { publicKey } = await adapter.connect()
      setPasskeyPublicKey(publicKey)
      connectSuccess("passkey", publicKey)
      useMultiWalletStore.setState((s) => ({
        wallets: {
          ...s.wallets,
          passkey: { ...s.wallets.passkey, adapter, publicKey, status: "connected" as const },
        },
      }))
      setLocalStep("profile")
      addToast({
        type: "success",
        title: "Passkey Created",
        description: "Your wallet is ready. Now set up your profile.",
      })
    } catch (err: unknown) {
      const message = (err && typeof err === "object" && "message" in err)
        ? (err as { message: string }).message
        : "Passkey setup failed"
      addToast({ type: "error", title: "Passkey Setup Failed", description: message })
    } finally {
      setIsCreatingPasskey(false)
      creatingPasskeyRef.current = false
    }
  }, [connectStart, connectSuccess, setPasskeyPublicKey, addToast])

  const handleProfileSubmit = useCallback(() => {
    setLocalStep("sign")
  }, [])

  const handleSignSubmit = useCallback(async () => {
    await sign()
    const authStatus = useAuthFlowStore.getState().status.status
    if (authStatus === "authenticated") {
      // Create Stellar wallet via backend
      try {
        const stored = JSON.parse(localStorage.getItem("moistello_passkey_credential") || "{}")
        const credentialId = stored.credentialId
        if (credentialId) {
          const enc = new TextEncoder()
          const seedBuf = await crypto.subtle.digest("SHA-256", enc.encode(credentialId))
          const passkeySeed = Array.from(new Uint8Array(seedBuf)).map(b => b.toString(16).padStart(2, "0")).join("")
          const { post } = await import("@/lib/api-client")
          await post("/wallets", { passkeySeed })
        }
      } catch (e) {
        console.error("Failed to create Stellar wallet:", e)
      }
      addToast({
        type: "success",
        title: "Welcome to Moistello!",
        description: "Your account has been created.",
      })
      router.replace("/dashboard")
    }
  }, [sign, router, addToast])

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
          steps={STEPS}
          currentStep={effectiveStep}
          className="mb-6"
        />

        <SessionTimeoutBanner />
        {passkeyRevoked && <PasskeyRevokedBanner />}

        {effectiveStep === "choose" && (
          <div className="space-y-6" aria-label="Create wallet step">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg-extended">
                  <Fingerprint className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="font-heading text-lg font-medium text-foreground">Create Your Wallet</p>
              <p className="text-sm text-muted-foreground">
                Generate a secure passkey wallet with your device.
                <br />
                No crypto knowledge needed.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
                {error.message}
              </div>
            )}

            <button
              type="button"
              onClick={handlePasskeyStart}
              disabled={isCreatingPasskey}
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
                  Create Wallet
                </>
              )}
            </button>

            {isCreatingPasskey && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Your browser will ask for biometric verification
              </div>
            )}

            <p className="text-center text-2xs text-muted-foreground">
              Your wallet is secured by your device biometrics.
              <br />
              No private keys leave your device.
            </p>
          </div>
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

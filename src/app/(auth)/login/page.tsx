"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
import { useAuthFlow, AuthFlowProvider } from "@/hooks/auth-flow-context"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
import { useUIStore } from "@/stores/ui-store"
import { useSignMessage } from "@/hooks/use-sign-message"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { useConditionalMediation } from "@/hooks/use-conditional-mediation"
import { recordMetric } from "@/lib/monitoring"
import { getWalletRegistry } from "@/lib/wallet/registry"
import { createPasskeyAdapter } from "@/lib/wallet/adapters/passkey"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignStep } from "@/components/auth/sign-step"
import { LoadingOverlay } from "@/components/auth/loading-overlay"
import { SessionTimeoutBanner } from "@/components/auth/session-timeout-banner"
import { PasskeyRevokedBanner } from "@/components/auth/passkey-revoked-banner"

getWalletRegistry().register(createPasskeyAdapter())

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
  const setStep = useAuthFlow((s) => s.setStep)

  const { sign } = useSignMessage()

  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    if (mode !== "login") startLoginFlow()
  }, [mode, startLoginFlow])

  useEffect(() => {
    import("@/lib/wallet/adapters/passkey").then(({ createPasskeyAdapter }) => {
      getWalletRegistry().register(createPasskeyAdapter())
    })
  }, [])

  const doPasskeyAuthenticate = useCallback(async () => {
    const store = useAuthFlowStore.getState()
    store.connectStart("passkey")

    try {
      const adapter = getWalletRegistry().getAdapter("passkey")
      if (!adapter) throw new Error("Passkey adapter not found")
      const { publicKey } = await adapter.connect()
      if (!publicKey) {
        throw new Error("Could not retrieve passkey address")
      }
      store.connectSuccess("passkey", publicKey)
      const authStatus = useAuthFlowStore.getState().status.status
      if (authStatus !== "authenticated") {
        await useAuthFlowStore.getState().signAndSubmit()
      }
      if (useAuthFlowStore.getState().status.status === "authenticated") {
        addToast({ type: "success", title: "Welcome back!", description: "You are now signed in." })
        router.replace("/dashboard")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Passkey authentication failed"
      store.setError("connection_rejected", msg)
      addToast({ type: "error", title: "Passkey Login Failed", description: msg })
    }
  }, [router, addToast])

  const handlePasskeyLogin = useCallback(() => {
    recordMetric("auth.flow.started", 1, { mode: "login", method: "passkey" })
    doPasskeyAuthenticate()
  }, [doPasskeyAuthenticate])

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
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg-extended">
                  <Shield className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="font-heading text-lg font-medium text-foreground">Sign In to Moistello</p>
              <p className="text-sm text-muted-foreground">
                Use your passkey to securely access your account.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
                {error.message}
              </div>
            )}

            <button
              type="button"
              onClick={handlePasskeyLogin}
              className="w-full h-12 rounded-xl gradient-bg-extended text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
            >
              <Shield className="h-4 w-4" />
              Sign in with Passkey
            </button>

            <p className="text-center text-2xs text-muted-foreground">
              Authenticate with your device biometrics.
              <br />
              Your email and device are your keys.
            </p>
          </div>
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

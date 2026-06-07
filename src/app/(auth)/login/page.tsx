"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
import { useTranslate } from "@/lib/locale/context"
import { useAuthFlow, AuthFlowProvider } from "@/hooks/auth-flow-context"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
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
  const { t } = useTranslate()
  const router = useRouter()
  useRedirectIfAuthenticated()
  const abortConditionalMediation = useConditionalMediation()

  const step = useAuthFlow((s) => s.step)
  const status = useAuthFlow((s) => s.status)
  const error = useAuthFlow((s) => s.error)
  const connection = useAuthFlow((s) => s.connection)
  const auth = useAuthFlow((s) => s.auth)
  const rateLimit = useAuthFlow((s) => s.rateLimit)
  const passkeyRevoked = useAuthFlow((s) => s.passkeyRevoked)

  const startLoginFlow = useAuthFlow((s) => s.startLoginFlow)
  const setStep = useAuthFlow((s) => s.setStep)

  const { sign } = useSignMessage()

  const addToast = useUIStore((s) => s.addToast)
  const authenticatingRef = useRef(false)

  const [hasCredential, setHasCredential] = useState<boolean | null>(null)

  useEffect(() => {
    startLoginFlow()
    setHasCredential(!!localStorage.getItem("moistello_passkey_credential"))
  }, [startLoginFlow])

  useEffect(() => {
    import("@/lib/wallet/adapters/passkey").then(({ createPasskeyAdapter }) => {
      getWalletRegistry().register(createPasskeyAdapter())
    })
  }, [])

  const doPasskeyAuthenticate = useCallback(async () => {
    if (authenticatingRef.current) return
    const store = useAuthFlowStore.getState()
    if (store.status.status === "connecting" || store.status.status === "signing") return
    authenticatingRef.current = true
    store.connectStart("passkey")

    try {
      const adapter = getWalletRegistry().getAdapter("passkey")
      if (!adapter) throw new Error("Passkey adapter not found")

      const storedCredential = localStorage.getItem("moistello_passkey_credential")
      if (!storedCredential) {
        authenticatingRef.current = false
        recordMetric("auth.login.no_credential", 1)
        addToast({ type: "info", title: t("auth.login.noAccountFound"), description: t("auth.login.createOneToStart") })
        router.replace("/register")
        return
      }

      // Cancel any pending conditional mediation (browser can't have two WebAuthn calls)
      abortConditionalMediation()
      // Clear stale in-memory session from previous login in same tab
      adapter.reset?.()
      const { publicKey } = await adapter.connect()
      if (!publicKey) {
        throw new Error("Could not retrieve passkey address")
      }
      store.connectSuccess("passkey", publicKey)
      useMultiWalletStore.setState((s) => ({
        wallets: {
          ...s.wallets,
          passkey: { ...s.wallets.passkey, adapter, publicKey, status: "connected" as const },
        },
      }))
      const authStatus = useAuthFlowStore.getState().status.status
      if (authStatus !== "authenticated") {
        await useAuthFlowStore.getState().signAndSubmit()
      }
      if (useAuthFlowStore.getState().status.status === "authenticated") {
        authenticatingRef.current = false
        addToast({ type: "success", title: t("auth.login.welcomeBack"), description: t("auth.login.welcomeDescription") })
        router.replace("/dashboard")
      }
    } catch (err: unknown) {
      authenticatingRef.current = false
      const msg = (err && typeof err === "object" && "message" in err)
        ? (err as { message: string }).message
        : "Passkey authentication failed"
      store.setError("connection_rejected", msg)
      addToast({ type: "error", title: t("auth.login.passkeyLoginFailed"), description: msg })
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
      // Ensure Stellar wallet exists
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
        // Wallet likely already exists — fine
        console.debug("Wallet creation skipped:", e)
      }
      addToast({
        type: "success",
        title: t("auth.login.welcomeBack"),
        description: t("auth.login.welcomeDescription"),
      })
      router.replace("/dashboard")
    }
  }, [sign, router, addToast])

  if (status.status === "authenticated") {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 py-8" role="status" aria-live="polite">
          <p className="text-sm text-muted-foreground">{t("auth.sign.redirecting")}</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <>
      <AuthLayout
        footerLinks={[
          { label: t("auth.login.dontHaveAccount"), href: "/register", text: t("auth.login.createAccount") },
          { label: "", href: "/", text: "\u2190 " + t("auth.register.backHome") },
        ]}
      >
        <SessionTimeoutBanner />
        {passkeyRevoked && <PasskeyRevokedBanner />}

        {(status.status === "connecting" || status.status === "signing") && (
          <LoadingOverlay
            isVisible
            text={
              status.status === "signing"
                ? t("auth.login.signingYouIn")
                : t("auth.login.connecting")
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
              <p className="font-heading text-lg font-medium text-foreground">{t("auth.login.signInTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("auth.login.signInDescription")}
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
                {error.message}
              </div>
            )}

            {hasCredential === false && (
              <div className="rounded-xl border border-aurora-violet/30 bg-aurora-violet/10 px-4 py-3 text-sm text-aurora-violet" role="status">
                {t("auth.login.noPasskey")}{" "}
                <Link href="/register" className="underline font-medium">{t("auth.login.createAccount")}</Link> {t("auth.login.toGetStarted")}
              </div>
            )}

            <button
              type="button"
              onClick={handlePasskeyLogin}
              className="w-full h-12 rounded-xl gradient-bg-extended text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
            >
              <Shield className="h-4 w-4" />
              {t("auth.login.signInButton")}
            </button>

            <p className="text-center text-2xs text-muted-foreground">
              {t("auth.login.biometricText")}
              <br />
              {t("auth.login.deviceIsKey")}
            </p>
          </div>
        ) : step === "sign" ? (
          <SignStep
            mode="login"
            connection={connection}
            profile={{ displayName: "", countryCode: "", language: "en" }}
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

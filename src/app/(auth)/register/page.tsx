"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, Fingerprint, Loader2, Mail, Shield } from "lucide-react"
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
import { getWalletRegistry } from "@/lib/wallet/registry"
import { createPasskeyAdapter } from "@/lib/wallet/adapters/passkey"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthStepIndicator } from "@/components/auth/auth-step-indicator"
import { VerifyEmailStep } from "@/components/auth/verify-email-step"
import { ProfileStep } from "@/components/auth/profile-step"
import { SignStep } from "@/components/auth/sign-step"
import { AuthInput } from "@/components/auth/auth-input"
import { TurnstileCaptcha } from "@/components/auth/turnstile-captcha"
import { SessionTimeoutBanner } from "@/components/auth/session-timeout-banner"
import { PasskeyRevokedBanner } from "@/components/auth/passkey-revoked-banner"

type Step = "choose" | "passkey-email" | "verify-email" | "profile" | "sign"

type PasskeyPhase = "email" | "code" | "captcha"

const STEPS = [
  { key: "choose", label: "Create", number: 1 },
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

getWalletRegistry().register(createPasskeyAdapter())

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

  const passkeyState = useMultiWalletStore((s) => s.passkeyState)
  const setPasskeyEmail = useMultiWalletStore((s) => s.setPasskeyEmail)
  const setPasskeyPublicKey = useMultiWalletStore((s) => s.setPasskeyPublicKey)

  const { emailVerification, sendCode, verifyCode: verifyEmailCode, resendCode } = useEmailVerification()
  const { sign } = useSignMessage()
  const { profile, updateField, setFieldError } = useProfileForm()

  const addToast = useUIStore((s) => s.addToast)
  const [localStep, setLocalStep] = useState<Step>("choose")

  const [passkeyPhase, setPasskeyPhase] = useState<PasskeyPhase>("email")
  const [passkeyEmailInput, setPasskeyEmailInput] = useState("")
  const [passkeyEmailError, setPasskeyEmailError] = useState<string | null>(null)
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""))
  const [codeError, setCodeError] = useState<string | null>(null)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [countdown, setCountdown] = useState(0)

  const effectiveStep = localStep
  const isPasskeyFlow = localStep === "passkey-email"

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

  useEffect(() => {
    const expiresAt = emailVerification.expiresAt
    if (!expiresAt) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [emailVerification.expiresAt])

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current)
    }
  }, [])

  const startResendCooldown = useCallback(() => {
    setResendCooldown(60)
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current) clearInterval(resendTimerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handlePasskeyEmailSubmit = useCallback(async () => {
    if (!EMAIL_REGEX.test(passkeyEmailInput)) {
      setPasskeyEmailError("Please enter a valid email address")
      return
    }
    if (passkeyEmailInput.length > 254) {
      setPasskeyEmailError("Email must be 254 characters or fewer")
      return
    }
    setPasskeyEmailError(null)
    setIsSendingCode(true)
    try {
      await sendCode(passkeyEmailInput)
      setPasskeyPhase("code")
      startResendCooldown()
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100)
    } catch {
      setPasskeyEmailError("Failed to send verification code. Please try again.")
    } finally {
      setIsSendingCode(false)
    }
  }, [passkeyEmailInput, sendCode, startResendCooldown])

  const handleCodeVerify = useCallback(async (code: string) => {
    if (isVerifyingCode) return
    setIsVerifyingCode(true)
    try {
      await verifyEmailCode(code)
      setPasskeyPhase("captcha")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid code. Please try again."
      setCodeError(message)
      setCodeDigits(Array(6).fill(""))
      codeInputRefs.current[0]?.focus()
    } finally {
      setIsVerifyingCode(false)
    }
  }, [verifyEmailCode, isVerifyingCode])

  const handleCodeDigitChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^\d$/.test(value)) return
      const next = [...codeDigits]
      next[index] = value
      setCodeDigits(next)
      setCodeError(null)

      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus()
      }

      const fullCode = [...next.slice(0, index), value, ...next.slice(index + 1)].join("")
      if (fullCode.length === 6 && !next.includes("")) {
        const allFilled = next.every((d) => d !== "")
        if (allFilled) {
          handleCodeVerify(fullCode)
        }
      }
    },
    [codeDigits, handleCodeVerify]
  )

  const handleCodeKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
        const next = [...codeDigits]
        next[index - 1] = ""
        setCodeDigits(next)
        codeInputRefs.current[index - 1]?.focus()
      }
      if (e.key === "Enter" && codeDigits.every((d) => d !== "")) {
        handleCodeVerify(codeDigits.join(""))
      }
    },
    [codeDigits, handleCodeVerify]
  )

  const handleCodePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const next = [...codeDigits]
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }
    setCodeDigits(next)
    if (pasted.length === 6) {
      handleCodeVerify(pasted)
    }
    const focusIdx = Math.min(pasted.length, 5)
    codeInputRefs.current[focusIdx]?.focus()
  }, [codeDigits, handleCodeVerify])

  const handlePasskeyContinue = useCallback(async () => {
    if (!passkeyEmailInput || !captchaToken || isCreatingPasskey) return
    setIsCreatingPasskey(true)
    setPasskeyEmail(passkeyEmailInput)
    connectStart("passkey")

    try {
      useAuthFlowStore.getState().setCaptchaToken(captchaToken)
      recordMetric("auth.flow.started", 1, { mode: "register", method: "passkey" })
      const adapter = getWalletRegistry().getAdapter("passkey")
      if (!adapter) throw new Error("Passkey adapter not found")
      const { publicKey } = await (adapter as { connect: (email: string) => Promise<{ publicKey: string }> }).connect(passkeyEmailInput)
      setPasskeyPublicKey(publicKey)
      connectSuccess("passkey", publicKey)
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
      setPasskeyEmailError(message)
      addToast({ type: "error", title: "Passkey Setup Failed", description: message })
    } finally {
      setIsCreatingPasskey(false)
    }
  }, [passkeyEmailInput, captchaToken, setPasskeyEmail, connectStart, connectSuccess, setPasskeyPublicKey, addToast])

  const handlePasskeyBack = useCallback(() => {
    if (passkeyPhase === "code") {
      setPasskeyPhase("email")
      setCodeDigits(Array(6).fill(""))
      setCodeError(null)
    } else if (passkeyPhase === "captcha") {
      setPasskeyPhase("code")
    } else {
      setLocalStep("choose")
      setPasskeyEmailError(null)
      setPasskeyEmailInput("")
      setCodeDigits(Array(6).fill(""))
      setCodeError(null)
      setCaptchaToken(null)
    }
  }, [passkeyPhase])

  const handlePasskeyResend = useCallback(async () => {
    if (resendCooldown > 0) return
    try {
      await resendCode()
      startResendCooldown()
      setCodeDigits(Array(6).fill(""))
      setCodeError(null)
    } catch {
      addToast({ type: "error", title: "Resend Failed", description: "Could not resend code. Try again." })
    }
  }, [resendCooldown, resendCode, startResendCooldown, addToast])

  const handlePasskeyStart = useCallback(() => {
    recordMetric("auth.flow.started", 1, { mode: "register", method: "passkey" })
    setLocalStep("passkey-email")
  }, [])

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
          <div className="space-y-6" aria-label="Create wallet step">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg-extended">
                  <Fingerprint className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="font-heading text-lg font-medium text-foreground">Create Your Wallet</p>
              <p className="text-sm text-muted-foreground">
                Generate a secure passkey wallet from your email.
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
              className="w-full h-12 rounded-xl gradient-bg-extended text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
            >
              <Shield className="h-4 w-4" />
              Create Wallet
            </button>

            <p className="text-center text-2xs text-muted-foreground">
              Your wallet is derived from your email and device biometrics.
              <br />
              No private keys leave your device.
            </p>
          </div>
        )}

        {effectiveStep === "passkey-email" && passkeyPhase === "email" && (
          <div className="space-y-6" aria-label="Passkey email step">
            <button
              type="button"
              onClick={handlePasskeyBack}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to email entry
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
                disabled={isSendingCode}
                maxLength={254}
              />

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
                  {error.message}
                </div>
              )}

              <button
                type="button"
                onClick={handlePasskeyEmailSubmit}
                disabled={!passkeyEmailInput || isSendingCode}
                className="w-full h-12 rounded-xl gradient-bg-extended text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Confirm Email
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-2xs text-muted-foreground">
              Your wallet is derived from your email and device biometrics.
              <br />
              No private keys leave your device.
            </p>
          </div>
        )}

        {effectiveStep === "passkey-email" && passkeyPhase === "code" && (
          <div className="space-y-6" aria-label="Passkey code verification step">
            <button
              type="button"
              onClick={handlePasskeyBack}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to email
            </button>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aurora-violet/20">
                  <Mail className="h-6 w-6 text-aurora-violet" />
                </div>
              </div>
              <p className="font-heading text-lg font-medium text-foreground">Check your inbox</p>
              <p className="text-sm text-muted-foreground">
                We sent a code to{" "}
                <span className="font-medium text-foreground">{passkeyEmailInput}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    onPaste={index === 0 ? handleCodePaste : undefined}
                    disabled={isVerifyingCode}
                    className="h-12 w-10 rounded-xl border border-white/20 bg-white/5 text-center text-lg font-bold text-foreground outline-none transition-colors focus:border-aurora-violet focus:ring-1 focus:ring-aurora-violet disabled:opacity-50"
                    aria-label={`Digit ${index + 1} of 6`}
                  />
                ))}
              </div>

              {codeError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-center" role="alert">
                  {codeError}
                </div>
              )}

              {isVerifyingCode && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verifying code...
                </div>
              )}

              {countdown > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Code expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                </div>
              )}

              <div className="text-center text-xs text-muted-foreground">
                Didn&apos;t receive it?{" "}
                {resendCooldown > 0 ? (
                  <span className="text-muted-foreground/60">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handlePasskeyResend}
                    className="text-aurora-cyan hover:underline"
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {effectiveStep === "passkey-email" && passkeyPhase === "captcha" && (
          <div className="space-y-6" aria-label="Passkey captcha step">
            <button
              type="button"
              onClick={handlePasskeyBack}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to code verification
            </button>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <p className="font-heading text-lg font-medium text-foreground">Email Verified</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{passkeyEmailInput}</span>
              </p>
            </div>

            <div className="space-y-4">
              <TurnstileCaptcha
                onVerify={(token) => setCaptchaToken(token)}
                onError={() => setCaptchaToken(null)}
              />

              {passkeyEmailError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-center" role="alert">
                  {passkeyEmailError}
                </div>
              )}

              <button
                type="button"
                onClick={handlePasskeyContinue}
                disabled={!captchaToken || isCreatingPasskey}
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
                    Continue
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

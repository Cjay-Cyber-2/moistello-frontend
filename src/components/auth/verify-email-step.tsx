"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft, Mail, Shield, CheckCircle, Loader2, AlertCircle, Fingerprint, Clock } from "lucide-react"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
import { cn } from "@/lib/cn"

type Phase =
  | { phase: "input" }
  | { phase: "sending" }
  | { phase: "sent"; verificationId: string; expiresAt: number }
  | { phase: "verifying" }
  | { phase: "verified" }
  | { phase: "error"; message: string; canRetry: boolean }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_RE = /^\d{6}$/
const CODE_EXPIRY_SECONDS = 600
const RESEND_COOLDOWN_SECONDS = 60

interface VerifyEmailStepProps {
  onVerified: () => void
  onBack: () => void
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function VerifyEmailStep({ onVerified, onBack }: VerifyEmailStepProps) {
  const { sendVerificationCode, verifyCode, resendCode, clearEmailVerification, emailVerification } =
    useAuthFlowStore()

  const [phase, setPhase] = useState<Phase>({ phase: "input" })
  const [email, setEmail] = useState(emailVerification.email || "")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const [expiryLeft, setExpiryLeft] = useState(CODE_EXPIRY_SECONDS)
  const codeRef = useRef<HTMLInputElement>(null)

  const emailValid = EMAIL_RE.test(email) && email.length <= 254

  const sentPhaseRef = useRef(phase.phase === "sent" ? (phase as { expiresAt: number }).expiresAt : 0)

  useEffect(() => {
    if (phase.phase === "sent") {
      sentPhaseRef.current = phase.expiresAt
    }
  }, [phase])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(id)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  useEffect(() => {
    if (phase.phase !== "sent") return
    const expiresAt = phase.expiresAt
    function tick() {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setExpiryLeft(remaining)
      if (remaining <= 0) {
        setPhase({ phase: "error", message: "Verification code has expired. Please request a new one.", canRetry: true })
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [phase.phase === "sent" ? phase.expiresAt : null])

  useEffect(() => {
    if (phase.phase === "verified") {
      const t = setTimeout(() => onVerified(), 800)
      return () => clearTimeout(t)
    }
  }, [phase.phase, onVerified])

  const handleSendCode = useCallback(async () => {
    if (!emailValid) return
    setError("")
    setPhase({ phase: "sending" })
    try {
      await sendVerificationCode(email.trim())
      const ev = useAuthFlowStore.getState().emailVerification
      const expiresAt = ev.expiresAt ?? Date.now() + CODE_EXPIRY_SECONDS * 1000
      setPhase({ phase: "sent", verificationId: ev.verificationId ?? "", expiresAt })
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setCode("")
      setTimeout(() => codeRef.current?.focus(), 100)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = axiosErr?.response?.data?.error ?? axiosErr?.message ?? "Failed to send verification code."
      setPhase({ phase: "error", message: msg, canRetry: true })
    }
  }, [email, emailValid, sendVerificationCode])

  const handleVerify = useCallback(async () => {
    if (!CODE_RE.test(code)) return
    setError("")
    setPhase({ phase: "verifying" })
    try {
      await verifyCode(code)
      setPhase({ phase: "verified" })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string; remainingAttempts?: number } } }
      const status = axiosErr?.response?.status
      const body = axiosErr?.response?.data
      if (status === 429) {
        setPhase({ phase: "error", message: "Too many attempts. Please wait before trying again.", canRetry: true })
      } else if (status === 410) {
        setPhase({ phase: "error", message: "Verification code has expired. Request a new one.", canRetry: false })
      } else {
        const msg = body?.error ?? "Invalid code."
        setPhase({ phase: "sent", verificationId: (phase as { verificationId: string }).verificationId, expiresAt: sentPhaseRef.current || Date.now() + CODE_EXPIRY_SECONDS * 1000 })
        setError(msg)
      }
    }
  }, [code, verifyCode, phase])

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return
    setError("")
    setPhase({ phase: "sending" })
    try {
      await resendCode()
      const ev = useAuthFlowStore.getState().emailVerification
      const expiresAt = ev.expiresAt ?? Date.now() + CODE_EXPIRY_SECONDS * 1000
      setPhase((prev) => ({
        phase: "sent",
        verificationId: (prev as { verificationId?: string }).verificationId ?? ev.verificationId ?? "",
        expiresAt,
      }))
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setCode("")
      setTimeout(() => codeRef.current?.focus(), 100)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = axiosErr?.response?.data?.error ?? axiosErr?.message ?? "Failed to resend code."
      setPhase({ phase: "error", message: msg, canRetry: true })
    }
  }, [cooldown, resendCode, emailVerification.verificationId])

  const handleBackToEmail = useCallback(() => {
    clearEmailVerification()
    setCode("")
    setError("")
    setPhase({ phase: "input" })
  }, [clearEmailVerification])

  const handleBackToWallet = useCallback(() => {
    clearEmailVerification()
    onBack()
  }, [clearEmailVerification, onBack])

  const handleRetryFromError = useCallback(() => {
    setError("")
    if (emailValid && !emailVerification.codeSent) {
      setPhase({ phase: "input" })
    } else if (emailVerification.verificationId) {
      setPhase({
        phase: "sent",
        verificationId: emailVerification.verificationId,
        expiresAt: emailVerification.expiresAt ?? Date.now() + CODE_EXPIRY_SECONDS * 1000,
      })
    } else {
      setPhase({ phase: "input" })
    }
  }, [emailValid, emailVerification])

  if (phase.phase === "verified") {
    return (
      <div className="flex flex-col items-center gap-4 py-10" role="status" aria-live="polite">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/30" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/20">
            <CheckCircle className="h-7 w-7 text-emerald-400" />
          </span>
        </div>
        <p className="font-heading text-lg font-semibold text-foreground">Email verified!</p>
        <p className="text-sm text-muted-foreground">Creating your passkey...</p>
        <Loader2 className="h-5 w-5 animate-spin text-aurora-violet" />
      </div>
    )
  }

  if (phase.phase === "sending") {
    return (
      <div className="flex flex-col items-center gap-4 py-10" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-aurora-violet" />
        <p className="text-sm font-medium text-foreground">Sending verification code...</p>
      </div>
    )
  }

  if (phase.phase === "sent" || (phase.phase === "verifying")) {
    const verifying = phase.phase === "verifying"
    const expiresAt = phase.phase === "sent" ? phase.expiresAt : sentPhaseRef.current

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={handleBackToEmail}
          disabled={verifying}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Change email
        </button>

        <div className="text-center space-y-1">
          <p className="font-heading text-base font-semibold text-foreground">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            We sent a code to{" "}
            <strong className="text-foreground">{email}</strong>
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="verification-code"
            className="block font-heading text-xs tracking-wider uppercase text-muted-foreground"
          >
            Enter the 6-digit code
          </label>
          <div className="relative">
            <input
              ref={codeRef}
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              disabled={verifying}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6)
                setCode(v)
                setError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6 && !verifying) handleVerify()
              }}
              className={cn(
                "block w-full h-11 bg-transparent px-3 py-2 text-center text-2xl tracking-[0.5em] font-mono text-foreground placeholder:text-muted-foreground/50",
                "border-b-2 border-border transition-all duration-300 rounded-none focus:outline-none",
                "focus:border-aurora-violet focus:shadow-[0_0_12px_rgb(var(--aurora-violet)/0.1)]",
                "disabled:cursor-not-allowed disabled:opacity-40",
                error && "border-b-red-500 shadow-[0_0_12px_rgb(239_68_68/0.1)]",
              )}
              aria-describedby={error ? "code-error" : undefined}
              aria-invalid={!!error}
            />
          </div>
          {error && (
            <p id="code-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={code.length !== 6 || verifying}
          className={cn(
            "w-full h-11 rounded-xl gradient-bg-extended text-white font-heading text-sm font-bold tracking-wide uppercase",
            "transition-all hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none",
            "flex items-center justify-center gap-2",
          )}
        >
          {verifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying code...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Verify Code
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={cooldown > 0 || verifying}
            onClick={handleResend}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            Didn't receive it?{" "}
            <span className={cooldown > 0 ? "" : "text-aurora-cyan"}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
            </span>
          </button>

          {expiresAt > 0 && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatCountdown(expiryLeft)}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (phase.phase === "error") {
    return (
      <div className="space-y-5">
        <div
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
          <p className="text-sm text-red-400">{phase.message}</p>
        </div>

        {phase.canRetry ? (
          <button
            type="button"
            onClick={handleRetryFromError}
            className={cn(
              "w-full h-11 rounded-xl gradient-bg-extended text-white font-heading text-sm font-bold tracking-wide uppercase",
              "transition-all hover:opacity-90",
              "flex items-center justify-center gap-2",
            )}
          >
            Try Again
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBackToEmail}
            className={cn(
              "w-full h-11 rounded-xl border border-white/10 text-foreground font-heading text-sm font-bold tracking-wide uppercase",
              "transition-all hover:bg-white/[0.06]",
              "flex items-center justify-center gap-2",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Email
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={handleBackToWallet}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to wallet options
      </button>

      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-aurora-violet/20">
          <Fingerprint className="h-7 w-7 text-aurora-violet" />
        </span>
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">Create Your Account</p>
          <p className="text-sm text-muted-foreground mt-1">Enter your email to get started</p>
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="verify-email"
          className="block font-heading text-xs tracking-wider uppercase text-muted-foreground"
        >
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            id="verify-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && emailValid) handleSendCode()
            }}
            className={cn(
              "block w-full h-11 bg-transparent pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50",
              "border-b-2 border-border transition-all duration-300 rounded-none focus:outline-none",
              "focus:border-aurora-violet focus:shadow-[0_0_12px_rgb(var(--aurora-violet)/0.1)]",
              error && "border-b-red-500 shadow-[0_0_12px_rgb(239_68_68/0.1)]",
            )}
            aria-describedby={error ? "email-error" : undefined}
            aria-invalid={!!error}
          />
        </div>
        {error && (
          <p id="email-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSendCode}
        disabled={!emailValid}
        className={cn(
          "w-full h-11 rounded-xl gradient-bg-extended text-white font-heading text-sm font-bold tracking-wide uppercase",
          "transition-all hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none",
          "flex items-center justify-center gap-2",
        )}
      >
        Confirm Email
      </button>

      <p className="text-center text-2xs text-muted-foreground leading-relaxed">
        Your email is used only for verification. Your cryptographic keys are derived locally and stored on this device.
      </p>
    </div>
  )
}

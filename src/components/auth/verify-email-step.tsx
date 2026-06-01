"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, Loader2, Mail, Shield } from "lucide-react"
import { cn } from "@/lib/cn"
import { AuthInput } from "./auth-input"
import { TurnstileCaptcha } from "./turnstile-captcha"
import { ErrorDisplay } from "./error-display"
import type { AuthErrorCode, AuthFlowStatus } from "@/stores/auth-flow-store"

interface EmailVerification {
  email: string
  verificationId: string | null
  codeSent: boolean
  codeVerified: boolean
  expiresAt: number | null
  remainingAttempts: number
}

interface VerifyEmailStepProps {
  emailVerification: EmailVerification
  status: AuthFlowStatus
  error: { code: AuthErrorCode | null; message: string | null } | null
  onSendCode: (email: string) => Promise<void>
  onVerifyCode: (code: string) => Promise<void>
  onResend: () => Promise<void>
  onBack: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function VerifyEmailStep({
  emailVerification,
  status,
  error,
  onSendCode,
  onVerifyCode,
  onResend,
  onBack,
}: VerifyEmailStepProps) {
  const [email, setEmail] = useState(emailVerification.email)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""))
  const [codeError, setCodeError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isSending = status.status === "sending_code"
  const isVerifying = status.status === "verifying_code"
  const hasCodeBeenSent = emailVerification.codeSent
  const isVerified = emailVerification.codeVerified
  const expiresAt = emailVerification.expiresAt
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (!expiresAt) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

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

  const handleEmailSubmit = useCallback(async () => {
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address")
      return
    }
    if (email.length > 254) {
      setEmailError("Email must be 254 characters or fewer")
      return
    }
    setEmailError(null)
    await onSendCode(email)
    startResendCooldown()
  }, [email, onSendCode, startResendCooldown])

  const handleCodeDigitChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^\d$/.test(value)) return

      const next = [...codeDigits]
      next[index] = value
      setCodeDigits(next)
      setCodeError(null)

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }

      const fullCode = next.join("")
      if (fullCode.length === 6 && /^\d{6}$/.test(fullCode)) {
        onVerifyCode(fullCode)
      }
    },
    [codeDigits, onVerifyCode]
  )

  const handleCodeKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    },
    [codeDigits]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
      if (!pasted) return
      const next = Array(6).fill("")
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i]
      }
      setCodeDigits(next)
      setCodeError(null)
      if (pasted.length === 6) {
        onVerifyCode(pasted)
      } else {
        inputRefs.current[pasted.length]?.focus()
      }
    },
    [onVerifyCode]
  )

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return
    await onResend()
    startResendCooldown()
  }, [onResend, resendCooldown, startResendCooldown])

  if (isVerified) {
    return (
      <div className="flex flex-col items-center gap-4 py-8" role="status" aria-live="polite">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
          <Mail className="h-6 w-6 text-emerald-400" />
        </div>
        <p className="text-sm font-medium text-foreground">Email verified!</p>
        <p className="text-xs text-muted-foreground">Proceeding to next step...</p>
        <Loader2 className="h-5 w-5 animate-spin text-aurora-violet" />
      </div>
    )
  }

  if (hasCodeBeenSent && emailVerification.email) {
    return (
      <div className="space-y-6" aria-label="Email verification form">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
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
            <span className="font-medium text-foreground">{emailVerification.email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {codeDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={isVerifying}
                className={cn(
                  "h-12 w-10 rounded-xl border bg-background/50 text-center text-lg font-bold text-foreground transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-aurora-violet/50 focus:border-transparent",
                  codeError ? "border-red-500/50" : "border-white/10",
                  isVerifying && "opacity-50 pointer-events-none"
                )}
                aria-label={`Digit ${i + 1} of 6`}
              />
            ))}
          </div>

          {codeError && (
            <p className="text-center text-xs text-red-400" role="alert">
              {codeError}
            </p>
          )}

          {error && (
            <ErrorDisplay
              code={error.code}
              message={error.message}
              canRetry={error.code !== "email_code_invalid"}
              onRetry={handleResend}
            />
          )}

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying code...
            </div>
          )}

          {!isVerifying && (
            <button
              type="button"
              onClick={() => onVerifyCode(codeDigits.join(""))}
              disabled={codeDigits.join("").length !== 6}
              className="w-full h-11 rounded-xl gradient-bg text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
            >
              Verify Code
            </button>
          )}
        </div>

        <div className="text-center space-y-2">
          {countdown > 0 ? (
            <p className="text-xs text-muted-foreground">
              Code expires in{" "}
              <span className="font-mono text-foreground">
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
              </span>
            </p>
          ) : (
            <p className="text-xs text-red-400">Code expired. Request a new one.</p>
          )}

          {emailVerification.remainingAttempts < 5 && emailVerification.remainingAttempts > 0 && (
            <p className="text-xs text-amber-400">
              {emailVerification.remainingAttempts} attempt{emailVerification.remainingAttempts !== 1 ? "s" : ""} remaining
            </p>
          )}

          <div className="flex items-center justify-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Didn&apos;t receive it?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isVerifying}
              className="font-medium text-aurora-cyan hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed transition-colors"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" aria-label="Email verification form">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aurora-violet/20">
            <Shield className="h-6 w-6 text-aurora-violet" />
          </div>
        </div>
        <p className="font-heading text-lg font-medium text-foreground">Verify your email</p>
        <p className="text-sm text-muted-foreground">
          Enter your email to get started. We&apos;ll send a verification code.
        </p>
      </div>

      <div className="space-y-4">
        <AuthInput
          label="Email address"
          type="email"
          autoCompleteType="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
          error={emailError}
          disabled={isSending}
          maxLength={254}
        />

        <TurnstileCaptcha
          onVerify={setCaptchaToken}
          onError={() => setCaptchaToken(null)}
        />

        {error && (
          <ErrorDisplay
            code={error.code}
            message={error.message}
            canRetry={error.code !== "validation_error"}
            onRetry={handleEmailSubmit}
          />
        )}

        <button
          type="button"
          onClick={handleEmailSubmit}
          disabled={!email || !captchaToken || isSending}
          className="w-full h-11 rounded-xl gradient-bg text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Confirm Email"
          )}
        </button>
      </div>

      <p className="text-center text-2xs text-muted-foreground">
        Your email is used to derive a unique cryptographic key on this device.
        We never store your email on the blockchain.
      </p>
    </div>
  )
}

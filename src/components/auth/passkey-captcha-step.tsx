"use client"

import { useState } from "react"
import { ArrowLeft, Fingerprint, Loader2, Shield } from "lucide-react"
import { HCaptchaCaptcha } from "./hcaptcha-captcha"

interface PasskeyCaptchaStepProps {
  email: string | null
  onVerified: (captchaToken: string) => void
  onBack: () => void
}

export function PasskeyCaptchaStep({ email, onVerified, onBack }: PasskeyCaptchaStepProps) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContinue = async () => {
    if (!captchaToken) return
    setIsSubmitting(true)
    try {
      onVerified(captchaToken)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6" aria-label="Passkey captcha verification">
      <button
        type="button"
        onClick={onBack}
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
        <p className="font-heading text-lg font-medium text-foreground">Verify it&apos;s you</p>
        <p className="text-sm text-muted-foreground">
          {email ? (
            <>
              Signing in as <span className="font-medium text-foreground">{email}</span>
            </>
          ) : (
            "Verify your identity to continue"
          )}
        </p>
      </div>

      <div className="space-y-4">
        <HCaptchaCaptcha
          onVerify={(token) => setCaptchaToken(token)}
          onError={() => setCaptchaToken(null)}
          onFocusNext={() => {
            const btn = document.getElementById("passkey-captcha-continue")
            btn?.focus()
          }}
        />

        <button
          id="passkey-captcha-continue"
          type="button"
          onClick={handleContinue}
          disabled={!captchaToken || isSubmitting}
          className="w-full h-12 rounded-xl gradient-bg-extended text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Continue
            </>
          )}
        </button>
      </div>
    </div>
  )
}

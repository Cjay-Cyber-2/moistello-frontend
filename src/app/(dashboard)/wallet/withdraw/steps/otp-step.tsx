"use client"

import { Key, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"

interface Props {
  otp: string[]
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  loading: boolean
  errMsg: string
  resendCooldown: number
  onOtpChange: (index: number, val: string) => void
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void
  onVerify: () => void
  onResend: () => void
}

export function OtpStep({
  otp, otpRefs, loading, errMsg, resendCooldown,
  onOtpChange, onOtpKeyDown, onVerify, onResend,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="border border-white/10 rounded-xl p-8 text-center space-y-5">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-aurora-violet/15 mx-auto">
          <Key className="h-7 w-7 text-aurora-violet" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">Enter OTP</p>
          <p className="text-sm text-muted-foreground mt-1">
            A 6-digit code was sent to your registered email
          </p>
        </div>

        {/* OTP input row */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => onOtpChange(i, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(i, e)}
              aria-label={`OTP digit ${i + 1}`}
              className={cn(
                "w-10 sm:w-12 h-12 sm:h-14 text-center text-xl font-bold font-heading text-foreground",
                "bg-white/5 border rounded-xl outline-none transition-all",
                "focus:border-aurora-violet focus:ring-1 focus:ring-aurora-violet/30",
                digit ? "border-aurora-violet/50" : "border-white/10",
              )}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={resendCooldown > 0 || loading}
            className="text-aurora-violet hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
          </button>
        </p>
      </div>

      {errMsg && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errMsg}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onVerify}
        isLoading={loading}
        disabled={otp.join("").length !== 6}
      >
        Verify & Complete Withdrawal
      </Button>
    </div>
  )
}

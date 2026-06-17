"use client"

import React, { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, LogIn, ArrowRight, ArrowLeft } from "lucide-react"
import { post } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const addToast = useUIStore((s) => s.addToast)
  useRedirectIfAuthenticated()

  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleSendCode = useCallback(async () => {
    if (!email.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await post(`/auth/login`, { email: email.trim() })
      if ((res as Record<string, unknown>)?.error) {
        setError((res as Record<string, unknown>).error as string)
        return
      }
      setStep("otp")
      setCooldown(60)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to send code")
    } finally {
      setLoading(false)
    }
  }, [email])

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return
    setLoading(true)
    setError("")
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await post(`/auth/login/verify`, { email: email.trim(), code })
      const body = res?.data ?? res
      if (body?.token) {
        useAuthStore.getState().setTokens(body.token, body.refreshToken ?? "", body.user)
        addToast({ type: "success", title: "Welcome back", description: "You are now signed in." })
        router.replace("/")
      } else {
        setError("Invalid response from server")
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Invalid code. Try again.")
    } finally {
      setLoading(false)
    }
  }, [email, code, router, addToast])

  return (
    <AuthLayout title="Sign In">
      <div className="space-y-5">
        {step === "email" ? (
          <>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
              leftIcon={<Mail className="h-4 w-4" />}
              error={error}
            />
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSendCode}
              isLoading={loading}
              disabled={!email.trim()}
              leftIcon={<ArrowRight className="h-4 w-4" />}
            >
              Send Verification Code
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setStep("email"); setError("") }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change email
              </button>
            </div>
            <p className="text-sm text-muted-foreground -mt-2 mb-2">
              Code sent to <strong className="text-foreground">{email}</strong>
            </p>
            <Input
              label="6-digit verification code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              error={error}
            />
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleVerify}
              isLoading={loading}
              disabled={code.length !== 6}
              leftIcon={<LogIn className="h-4 w-4" />}
            >
              Sign In
            </Button>
            <div className="text-center">
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleSendCode}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="gradient-text font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

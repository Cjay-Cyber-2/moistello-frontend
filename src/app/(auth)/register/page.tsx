"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, UserPlus, ArrowRight, ArrowLeft, CheckCircle, Shield, Lock, Wallet, Copy } from "lucide-react"
import { post, patch } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ProfileStep } from "@/components/auth/profile-step"
import { VerifyEmailStep } from "@/components/auth/verify-email-step"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const router = useRouter()
  const addToast = useUIStore((s) => s.addToast)

  // Redirect authenticated users away from register page
  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) {
      router.replace("/")
    }
  }, [router])

  type Step = "email" | "otp" | "profile" | "verify-email" | "wallet" | "passkey" | "done"
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [language, setLanguage] = useState("en")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [walletInfo, setWalletInfo] = useState<{
    publicKey: string
    fundingStatus: "pending" | "funded"
    trustlineStatus: "pending" | "ready"
  } | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleRegister = useCallback(async () => {
    if (!email.trim() || password.length < 8) return
    setLoading(true)
    setError("")
    try {
      const res: any = await post("/auth/register", { email: email.trim(), password })
      if (res?.error) { setError(res.error); return }
      setStep("otp")
      setCooldown(60)
      addToast({ type: "info", title: "Code sent", description: "Check your email for the verification code." })
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }, [email, password, addToast])

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return
    setLoading(true)
    setError("")
    try {
      const res: any = await post("/auth/register/verify", { email: email.trim(), code })
      const body = res?.data ?? res
      if (body?.token) {
        await useAuthStore.getState().setTokens(body.token, body.refreshToken ?? "", body.user)
        // Claim a name before showing profile step
        let claimed = ""
        try {
          const nameRes: any = await post("/claim-name")
          const nameBody = nameRes?.data ?? nameRes
          if (nameBody?.name) claimed = nameBody.name
        } catch { /* use fallback name */ }
        if (!claimed) claimed = "Moistello User"
        setDisplayName(claimed)
        setStep("profile")
      } else {
        setError("Invalid response")
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid code")
    } finally {
      setLoading(false)
    }
  }, [email, code])

  const handleProfile = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      await patch("/users/me", { displayName: displayName || undefined, preferredLanguage: language })
      addToast({ type: "success", title: "Profile saved" })
      setStep("verify-email")
    } catch {
      setError("Failed to save profile")
    } finally {
      setLoading(false)
    }
  }, [displayName, language, addToast])

  const handleUpdateLanguage = useCallback((lang: string) => {
    setLanguage(lang)
  }, [])

  const handleCreateWallet = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response: any = await post("/wallet/create", {
        asset: "USDC",
        network: "testnet",
      })
      const body = response?.data ?? response
      const publicKey = body?.publicKey ?? body?.public_key ?? body?.wallet?.publicKey
      if (!publicKey) throw new Error("Wallet service did not return a public key")

      setWalletInfo({
        publicKey,
        fundingStatus: body?.funded || body?.fundingStatus === "funded" ? "funded" : "pending",
        trustlineStatus:
          body?.usdcTrustline || body?.trustlineStatus === "ready" ? "ready" : "pending",
      })
      addToast({
        type: "success",
        title: "Stellar wallet created",
        description: "Your public key is ready. Funding may take a few moments.",
      })
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to create wallet")
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const skipPasskey = useCallback(() => {
    setStep("done")
    setTimeout(() => router.replace("/"), 500)
  }, [router])

  const handleLinkPasskey = useCallback(async () => {
    setLoading(true)
    try {
      const adapter = (await import("@/lib/wallet/registry")).getWalletRegistry().getAdapter("passkey")
      if (adapter) {
        await adapter.connect?.()
        const stored = localStorage.getItem("moistello_passkey_credential")
        if (stored) {
          const { credentialId } = JSON.parse(stored)
          if (credentialId) {
            await post("/auth/passkey/link", { credentialId })
            addToast({ type: "success", title: "Passkey linked" })
          }
        }
      }
    } catch (e) {
      console.warn("[register] Passkey setup skipped:", e)
    }
    setLoading(false)
    skipPasskey()
  }, [addToast, skipPasskey])

  return (
    <AuthLayout title="Create Account">
      <div className="space-y-5">
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="font-heading text-lg font-semibold text-foreground">All set!</p>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        ) : step === "email" ? (
          <>
            <Input label="Email address" type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="h-4 w-4" />} error={error} />
            <Input label="Password" type="password" placeholder="Min 8 characters" value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              leftIcon={<Lock className="h-4 w-4" />} />
            <Button variant="primary" size="lg" className="w-full" onClick={handleRegister}
              isLoading={loading} disabled={!email.trim() || password.length < 8}
              leftIcon={<ArrowRight className="h-4 w-4" />}>
              Create Account
            </Button>
          </>
        ) : step === "otp" ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setStep("email")}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Change email
              </button>
            </div>
            <p className="text-sm text-muted-foreground -mt-2 mb-2">
              Code sent to <strong className="text-foreground">{email}</strong>
            </p>
            <Input label="6-digit verification code" placeholder="000000" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="text-center text-2xl tracking-[0.5em] font-mono" error={error} />
            <Button variant="primary" size="lg" className="w-full" onClick={handleVerify}
              isLoading={loading} disabled={code.length !== 6} leftIcon={<UserPlus className="h-4 w-4" />}>
              Verify & Continue
            </Button>
            <div className="text-center">
              <button type="button" disabled={cooldown > 0} onClick={handleRegister}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </>
        ) : step === "profile" ? (
          <ProfileStep
            displayName={displayName}
            language={language}
            onUpdateLanguage={handleUpdateLanguage}
            onSubmit={handleProfile}
            isSubmitting={loading}
          />
        ) : step === "verify-email" ? (
          <VerifyEmailStep
            onVerified={() => setStep("wallet")}
            onBack={() => setStep("profile")}
          />
        ) : step === "wallet" ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 border-l-4 border-l-aurora-violet pl-4">
              <Wallet className="mt-1 h-7 w-7 shrink-0 text-aurora-violet" />
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">
                  Create your Stellar wallet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We generate your account, request funding from the master pool,
                  and prepare a USDC trustline.
                </p>
              </div>
            </div>

            {!walletInfo ? (
              <Button
                variant="premium"
                size="lg"
                className="w-full"
                onClick={handleCreateWallet}
                isLoading={loading}
                leftIcon={<Wallet className="h-4 w-4" />}
              >
                Create Stellar Wallet
              </Button>
            ) : (
              <>
                <div className="border-y border-white/10 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Stellar public key
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-sm text-foreground">
                      {walletInfo.publicKey}
                    </code>
                    <button
                      type="button"
                      aria-label="Copy Stellar public key"
                      onClick={() => void navigator.clipboard.writeText(walletInfo.publicKey)}
                      className="shrink-0 text-aurora-violet hover:text-foreground"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <ol className="space-y-3" aria-label="Wallet provisioning status">
                  <li className="flex items-center justify-between text-sm">
                    <span>Account funding</span>
                    <span className={walletInfo.fundingStatus === "funded" ? "text-emerald-400" : "text-amber-400"}>
                      {walletInfo.fundingStatus === "funded" ? "Funded" : "Pending from master pool"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span>USDC trustline</span>
                    <span className={walletInfo.trustlineStatus === "ready" ? "text-emerald-400" : "text-amber-400"}>
                      {walletInfo.trustlineStatus === "ready" ? "Ready" : "Being configured"}
                    </span>
                  </li>
                </ol>
                <Button className="w-full" onClick={() => setStep("passkey")}>
                  Continue
                </Button>
              </>
            )}
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          </div>
        ) : step === "passkey" ? (
          <>
            <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
              <Shield className="h-10 w-10 text-aurora-violet" />
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">Faster Login with Passkey</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your device&apos;s biometric to sign in without typing your password.
                </p>
              </div>
            </div>
            <Button variant="premium" size="lg" className="w-full" onClick={handleLinkPasskey}
              isLoading={loading}>
              Link Passkey
            </Button>
            <Button variant="ghost" size="md" className="w-full" onClick={skipPasskey}>
              Skip — I&apos;ll do it later
            </Button>
          </>
        ) : null}

        {step === "email" && (
          <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
            Already have an account?{" "}
            <Link href="/login" className="gradient-text font-semibold hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}

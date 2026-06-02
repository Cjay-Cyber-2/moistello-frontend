"use client"

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react"
import { cn } from "@/lib/cn"
import { Loader2, Check, X } from "lucide-react"

const MAX_RETRIES = 3
const EXECUTE_TIMEOUT = 30_000

interface HCaptchaCaptchaProps {
  onVerify: (token: string) => void
  onError?: (error: string) => void
  onFocusNext?: () => void
  className?: string
}

export interface HCaptchaCaptchaHandle {
  reset: () => void
}

type CaptchaState = "loading" | "ready" | "verifying" | "verified" | "error"

interface HCaptchaAPI {
  render: (container: string | HTMLElement, options: Record<string, unknown>) => string
  execute: (widgetId: string) => Promise<void>
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
  getResponse: (widgetId: string) => string
}

declare global {
  interface Window {
    hcaptcha?: HCaptchaAPI
    onCaptchaReady?: () => void
  }
}

function getSiteKey(): string {
  try {
    return process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? ""
  } catch {
    return ""
  }
}

const SCRIPT_ID = "hcaptcha-sdk"

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      if (window.hcaptcha) {
        resolve()
        return
      }
      window.onCaptchaReady = resolve
      return
    }

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load hCaptcha script"))
    document.head.appendChild(script)
  })
}

export const HCaptchaCaptcha = forwardRef<HCaptchaCaptchaHandle, HCaptchaCaptchaProps>(
  function HCaptchaCaptcha({ onVerify, onError, onFocusNext, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const retryCountRef = useRef(0)
    const mountedRef = useRef(true)
    const [state, setState] = useState<CaptchaState>("loading")
    const [retryKey, setRetryKey] = useState(0)
    const siteKey = getSiteKey()

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.hcaptcha) {
          try { window.hcaptcha.reset(widgetIdRef.current) } catch {}
        }
        setState("ready")
      },
    }), [])

    // Init: load script, render invisible widget
    useEffect(() => {
      if (!siteKey) {
        setState("error")
        return
      }

      let cancelled = false

      async function init() {
        try {
          setState("loading")
          await loadScript()

          if (cancelled || !window.hcaptcha || !containerRef.current) return

          if (widgetIdRef.current) {
            try { window.hcaptcha.remove(widgetIdRef.current) } catch {}
            widgetIdRef.current = null
          }

          const widgetId = window.hcaptcha.render(containerRef.current, {
            sitekey: siteKey,
            size: "invisible",
            callback: (token: string) => {
              if (cancelled) return
              setState("verified")
              onVerify(token)
              onFocusNext?.()
            },
            "expired-callback": () => {
              if (cancelled) return
              // Re-run the challenge silently
              setState("ready")
            },
            "error-callback": (error: string) => {
              if (cancelled) return
              setState("error")
              onError?.(error)
            },
          })

          widgetIdRef.current = widgetId
          retryCountRef.current = 0
          setState("ready")
        } catch {
          if (cancelled) return
          retryCountRef.current++
          if (retryCountRef.current >= MAX_RETRIES) {
            setState("error")
          } else {
            setRetryKey((k) => k + 1)
          }
          onError?.("Failed to load hCaptcha")
        }
      }

      init()

      return () => {
        cancelled = true
        if (widgetIdRef.current && window.hcaptcha) {
          try { window.hcaptcha.remove(widgetIdRef.current) } catch {}
          widgetIdRef.current = null
        }
      }
    }, [siteKey, onVerify, onError, onFocusNext, retryKey])

    // Auto-execute: when widget is ready, run the challenge in background
    useEffect(() => {
      if (state !== "ready") return
      if (!widgetIdRef.current || !window.hcaptcha) return

      let cancelled = false
      let tid: ReturnType<typeof setTimeout> | undefined

      async function run() {
        setState("verifying")
        try {
          const execPromise = window.hcaptcha!.execute(widgetIdRef.current!)
          const timeoutPromise = new Promise<void>((_, reject) => {
            tid = setTimeout(() => reject(new Error("timeout")), EXECUTE_TIMEOUT)
          })

          await Promise.race([execPromise, timeoutPromise])
          // callback handles setState("verified") + onVerify
        } catch {
          if (cancelled) return
          // Don't transition to error — the hcaptcha "error-callback"
          // will handle that. If execute itself throws (timeout), fall back.
          setState("error")
          onError?.("Verification timed out")
        } finally {
          if (tid) clearTimeout(tid)
        }
      }

      run()

      return () => {
        cancelled = true
        if (tid) clearTimeout(tid)
      }
    }, [state, onError])

    const handleRetry = useCallback(() => {
      if (widgetIdRef.current && window.hcaptcha) {
        try { window.hcaptcha.remove(widgetIdRef.current) } catch {}
        widgetIdRef.current = null
      }
      setState("loading")
      setRetryKey((k) => k + 1)
    }, [])

    useEffect(() => {
      return () => { mountedRef.current = false }
    }, [])

    if (!siteKey) {
      return (
        <div
          className={cn(
            "flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-background/30 px-4 py-3",
            className
          )}
        >
          <p className="text-xs text-muted-foreground">CAPTCHA not configured</p>
        </div>
      )
    }

    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-2">
          {state === "loading" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading verification...
            </div>
          )}

          {state === "ready" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin text-aurora-violet" aria-hidden="true" />
              Verifying...
            </div>
          )}

          {state === "verifying" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin text-aurora-violet" aria-hidden="true" />
              Verifying...
            </div>
          )}

          {state === "verified" && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500/20">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              Verified
            </div>
          )}

          {state === "error" && (
            <div className="flex items-center gap-2 text-xs text-red-400" role="alert">
              <X className="h-4 w-4" aria-hidden="true" />
              Verification unavailable
              <button
                type="button"
                onClick={handleRetry}
                className="ml-1 text-aurora-cyan hover:underline"
                autoFocus
              >
                Retry
              </button>
            </div>
          )}

          {/*
            Rendered off-screen in the layout tree so hCaptcha can show
            challenge popups. display:none prevents the popup from rendering.
          */}
          <div
            ref={containerRef}
            style={{ position: "absolute", left: "-9999px", visibility: "visible" }}
            aria-hidden="true"
          />
        </div>
      </div>
    )
  }
)

"use client"

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react"
import { cn } from "@/lib/cn"
import { Loader2, Check, X } from "lucide-react"

const MAX_RETRIES = 3

interface HCaptchaCaptchaProps {
  onVerify: (token: string) => void
  onError?: (error: string) => void
  onFocusNext?: () => void
  className?: string
}

export interface HCaptchaCaptchaHandle {
  reset: () => void
}

type CaptchaState = "loading" | "verified" | "error"

interface HCaptchaAPI {
  render: (container: string | HTMLElement, options: Record<string, unknown>) => string
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
    const [state, setState] = useState<CaptchaState>("loading")
    const [retryKey, setRetryKey] = useState(0)
    const siteKey = getSiteKey()

    // Store callbacks in refs to prevent useEffect re-runs
    // when parent passes inline functions (every React render).
    const onVerifyRef = useRef(onVerify)
    onVerifyRef.current = onVerify
    const onErrorRef = useRef(onError)
    onErrorRef.current = onError
    const onFocusNextRef = useRef(onFocusNext)
    onFocusNextRef.current = onFocusNext

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.hcaptcha) {
          try { window.hcaptcha.reset(widgetIdRef.current) } catch {}
        }
      },
    }), [])

    // Init: load script, render checkbox widget in normal flow.
    // Only re-runs when siteKey or retryKey changes — callback refs
    // absorb unstable parent function references.
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

          widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
            sitekey: siteKey,
            size: "normal",
            callback: (token: string) => {
              if (cancelled) return
              setState("verified")
              onVerifyRef.current(token)
              onFocusNextRef.current?.()
            },
            "expired-callback": () => {
              if (cancelled) return
              setState("error")
              onErrorRef.current?.("Verification expired. Please try again.")
            },
            "error-callback": (error: string) => {
              if (cancelled) return
              setState("error")
              onErrorRef.current?.(error)
            },
          })

          retryCountRef.current = 0
        } catch {
          if (cancelled) return
          retryCountRef.current++
          if (retryCountRef.current >= MAX_RETRIES) {
            setState("error")
            onErrorRef.current?.("Failed to load verification widget")
          } else {
            setRetryKey((k) => k + 1)
          }
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
    }, [siteKey, retryKey])

    const handleRetry = useCallback(() => {
      if (widgetIdRef.current && window.hcaptcha) {
        try { window.hcaptcha.remove(widgetIdRef.current) } catch {}
        widgetIdRef.current = null
      }
      setState("loading")
      setRetryKey((k) => k + 1)
    }, [])

    if (!siteKey) {
      return (
        <div className={cn("flex items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-3", className)}>
          <p className="text-xs text-muted-foreground">CAPTCHA not configured</p>
        </div>
      )
    }

    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        {state === "loading" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading verification...
          </div>
        )}

        <div ref={containerRef} style={{ minHeight: 78 }} />

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
      </div>
    )
  }
)

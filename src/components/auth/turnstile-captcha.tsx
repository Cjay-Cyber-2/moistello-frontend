"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/cn"
import { Loader2 } from "lucide-react"

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  "expired-callback"?: () => void
  "error-callback"?: () => void
  theme?: "light" | "dark" | "auto"
  size?: "normal" | "compact"
}

function getTurnstileSiteKey(): string {
  try {
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""
  } catch {
    return ""
  }
}

export function TurnstileCaptcha({
  onVerify,
  onExpire,
  onError,
  className,
}: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const siteKey = getTurnstileSiteKey()

  useEffect(() => {
    if (!containerRef.current || !siteKey) {
      setHasError(true)
      return
    }

    function initTurnstile() {
      if (!window.turnstile || !containerRef.current) return
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": onExpire,
        "error-callback": () => {
          setHasError(true)
          onError?.()
        },
        theme: "dark",
        size: "normal",
      })
      widgetIdRef.current = id
      setIsLoaded(true)
    }

    if (window.turnstile) {
      initTurnstile()
    } else {
      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
      script.async = true
      script.defer = true
      script.onload = initTurnstile
      script.onerror = () => {
        setHasError(true)
        onError?.()
      }
      document.head.appendChild(script)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, onVerify, onExpire, onError])

  if (!siteKey) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-background/30 px-4 py-3",
          className
        )}
      >
        <p className="text-xs text-muted-foreground">
          CAPTCHA not configured
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <div
        ref={containerRef}
        className={cn(
          "min-h-[65px]",
          !isLoaded && !hasError && "flex items-center justify-center"
        )}
      >
        {!isLoaded && !hasError && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-400">
          CAPTCHA loading failed. Please refresh and try again.
        </p>
      )}
    </div>
  )
}

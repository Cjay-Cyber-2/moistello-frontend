"use client"

import { useCallback, useState } from "react"
import { copyToClipboard } from "@/lib/clipboard"

const ERROR_CODE = "error-generating-code"

/** Generates and copies a circle invite code, tracking its own loading/error/copy state. */
export function useInviteGeneration(circleId: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [code, setCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const generate = useCallback(async () => {
    setIsLoading(true)
    setIsOpen(true)
    try {
      const { post } = await import("@/lib/api-client")
      const res = await post<Record<string, unknown>>(
        `/circles/${circleId}/invites`,
        { maxUses: 10, ttlHours: 24 },
      )
      const body = (res?.data as Record<string, unknown>) ?? res
      const inv = (body?.invite as Record<string, unknown>) ?? body
      setCode(String(inv?.code ?? ""))
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? (err instanceof Error ? err.message : "Failed to generate invite code")
      setError(msg)
      setCode(ERROR_CODE)
    } finally {
      setIsLoading(false)
    }
  }, [circleId])

  const copy = useCallback(async () => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  const close = useCallback(() => {
    setIsOpen(false)
    setCode("")
  }, [])

  return {
    isOpen,
    code,
    copied,
    isLoading,
    error,
    isError: code === ERROR_CODE,
    generate,
    copy,
    close,
  }
}

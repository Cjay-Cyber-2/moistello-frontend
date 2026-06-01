"use client"

import { useAuthFlowStore } from "@/stores/auth-flow-store"

export function useEmailVerification() {
  const emailVerification = useAuthFlowStore((s) => s.emailVerification)
  const status = useAuthFlowStore((s) => s.status)
  const error = useAuthFlowStore((s) => s.error)
  const sendVerificationCode = useAuthFlowStore((s) => s.sendVerificationCode)
  const verifyCodeAction = useAuthFlowStore((s) => s.verifyCode)
  const resendCodeAction = useAuthFlowStore((s) => s.resendCode)
  const clearEmailVerification = useAuthFlowStore((s) => s.clearEmailVerification)

  return {
    emailVerification,
    status,
    error,
    sendCode: sendVerificationCode,
    verifyCode: verifyCodeAction,
    resendCode: resendCodeAction,
    clearEmailVerification,
  }
}

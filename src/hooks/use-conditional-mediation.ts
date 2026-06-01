"use client"

import { useEffect } from "react"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
import { captureAuthError } from "@/lib/monitoring"

export function useConditionalMediation() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!window.PublicKeyCredential?.isConditionalMediationAvailable) return

    const mode = useAuthFlowStore.getState().mode
    if (mode !== "login") return

    let cancelled = false

    window.PublicKeyCredential.isConditionalMediationAvailable()
      .then((available) => {
        if (!available || cancelled) return

        const rpId = (typeof process !== "undefined" && (process.env as Record<string, string>).NEXT_PUBLIC_PASSKEY_RP_ID) || window.location.hostname

        navigator.credentials.get({
          mediation: "conditional",
          publicKey: {
            challenge: new Uint8Array(32),
            rpId,
            allowCredentials: [],
            userVerification: "required",
          },
        } as CredentialRequestOptions).then((credential) => {
          if (cancelled || !credential) return
          // User selected a passkey — trigger passkey login flow
          const store = useAuthFlowStore.getState()
          if (store.mode === "login") {
            store.connectStart("passkey")
            // The actual passkey authentication is handled
            // by the passkey adapter in choose-wallet-step
            store.setStep("sign")
          }
        }).catch((err: unknown) => {
          if ((err as DOMException)?.name === "AbortError") return
          captureAuthError(err, { step: "choose", mode: "login", errorCode: "internal_error" })
        })
      })
      .catch(() => {
        // Conditional mediation not available — fall through to normal flow
      })

    return () => { cancelled = true }
  }, [])
}

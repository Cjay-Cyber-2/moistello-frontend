"use client"

import { create } from "zustand"
import { devtools, persist, createJSONStorage } from "zustand/middleware"
import { post } from "@/lib/api-client"
import { recordMetric, captureAuthError } from "@/lib/monitoring"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
import { useAuthStore } from "@/stores/auth-store"

export type AuthFlowMode = "login" | "register"

export type AuthStep = "choose" | "verify-email" | "profile" | "sign"

export type AuthFlowStatus =
  | { status: "idle" }
  | { status: "detecting_wallets" }
  | { status: "connecting"; walletId: string | null }
  | { status: "awaiting_approval"; pairingUri: string | null; protocol: "qr" | "deeplink" | null }
  | { status: "connected"; walletId: string; address: string }
  | { status: "sending_code" }
  | { status: "code_sent" }
  | { status: "verifying_code" }
  | { status: "signing"; address: string }
  | { status: "signed"; signature: string; nonce: string }
  | { status: "error"; code: AuthErrorCode; message: string; canRetry: boolean }
  | { status: "authenticated" }

export type AuthErrorCode =
  | "connection_timeout"
  | "connection_rejected"
  | "relay_down"
  | "network_mismatch"
  | "auth_server_error"
  | "validation_error"
  | "passkey_revoked"
  | "email_send_failed"
  | "email_code_expired"
  | "email_code_invalid"
  | "email_rate_limited"
  | "internal_error"

const STEP_ORDER: AuthStep[] = ["choose", "verify-email", "profile", "sign"]

function getStepsForMode(mode: AuthFlowMode): AuthStep[] {
  return mode === "register" ? STEP_ORDER : STEP_ORDER.filter((s) => s !== "profile")
}

interface EmailVerification {
  email: string
  verificationId: string | null
  codeSent: boolean
  codeVerified: boolean
  expiresAt: number | null
  remainingAttempts: number
}

interface RateLimitState {
  remainingAttempts: number
  cooldownUntil: number | null
  lastAttemptAt: number | null
}

export interface AuthFlowState {
  mode: AuthFlowMode
  step: AuthStep
  status: AuthFlowStatus
  error: { code: AuthErrorCode | null; message: string | null } | null
  connection: {
    walletId: string | null
    address: string | null
    pairingUri: string | null
    protocol: "qr" | "deeplink" | null
    relayStatus: "healthy" | "degraded" | "down"
  }
  profile: {
    displayName: string
    email: string
    countryCode: string
    language: string
    fieldErrors: Record<string, string>
  }
  auth: {
    nonce: string | null
    signature: string | null
    nonceTimestamp: number | null
  }
  emailVerification: EmailVerification
  rateLimit: RateLimitState
  passkeyVersion: number
  passkeyRevoked: boolean
  captchaToken: string | null
}

interface AuthFlowActions {
  startLoginFlow: () => void
  startRegisterFlow: () => void
  reset: () => void
  setStep: (step: AuthStep) => void
  goBack: () => void
  setError: (code: AuthErrorCode, message: string) => void
  clearError: () => void
  resetConnection: () => void
  connect: (walletId: string) => Promise<void>
  connectStart: (walletId: string) => void
  connectSuccess: (walletId: string, address: string) => void
  awaitingApproval: (pairingUri: string, protocol: "qr" | "deeplink") => void
  onConnectionTimeout: () => void
  onConnectionRejected: () => void
  setPairingUri: (uri: string | null) => void
  setRelayStatus: (status: "healthy" | "degraded" | "down") => void
  sendVerificationCode: (email: string, captchaToken?: string) => Promise<void>
  verifyCode: (code: string) => Promise<void>
  resendCode: () => Promise<void>
  clearEmailVerification: () => void
  updateProfileField: (field: keyof AuthFlowState["profile"], value: string) => void
  setFieldError: (field: string, error: string | null) => void
  validateProfile: () => boolean
  signAndSubmit: () => Promise<void>
  signStart: (address: string) => void
  signSuccess: (signature: string, nonce: string) => void
  authenticated: () => void
  isEmailVerified: () => boolean
  isWalletConnected: () => boolean
  canProceed: () => boolean
  currentStepIndex: () => number
  totalSteps: () => number
  setCaptchaToken: (token: string | null) => void
}

export type AuthFlowStore = AuthFlowState & AuthFlowActions

const initialConnection = {
  walletId: null as string | null,
  address: null as string | null,
  pairingUri: null as string | null,
  protocol: null as "qr" | "deeplink" | null,
  relayStatus: "healthy" as "healthy" | "degraded" | "down",
}

const initialProfile = {
  displayName: "",
  email: "",
  countryCode: "",
  language: "en",
  fieldErrors: {} as Record<string, string>,
}

function initialEmailVerification(): EmailVerification {
  return {
    email: "",
    verificationId: null,
    codeSent: false,
    codeVerified: false,
    expiresAt: null,
    remainingAttempts: 5,
  }
}

function initialRateLimit(): RateLimitState {
  return {
    remainingAttempts: 5,
    cooldownUntil: null,
    lastAttemptAt: null,
  }
}

function createInitialState(): AuthFlowState {
  return {
    mode: "login",
    step: "choose",
    status: { status: "idle" } as AuthFlowStatus,
    error: null,
    connection: { ...initialConnection },
    profile: { ...initialProfile },
    auth: { nonce: null, signature: null, nonceTimestamp: null },
    emailVerification: initialEmailVerification(),
    rateLimit: initialRateLimit(),
    passkeyVersion: 0,
    passkeyRevoked: false,
    captchaToken: null,
  }
}

export async function verifyPasskeyRevocation(): Promise<void> {
  try {
    const { passkeyVersion } = useAuthFlowStore.getState()
    const response = await post<{
      revoked: boolean
      currentVersion: number
    }>("/auth/passkey/status", { passkeyVersion })
    if (!response.revoked) {
      useAuthFlowStore.setState({ passkeyRevoked: false, passkeyVersion: response.currentVersion })
    }
  } catch {
    // Server unreachable — keep current state, don't block UI
  }
}

export const useAuthFlowStore = create<AuthFlowStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...createInitialState(),

        startLoginFlow: () => set({ mode: "login", step: "choose", status: { status: "idle" } }),

        startRegisterFlow: () => set({ mode: "register", step: "choose", status: { status: "idle" } }),

        reset: () => set(createInitialState()),

        setStep: (step) => set({ step }),

        goBack: () => {
          const { step, mode } = get()
          const steps = getStepsForMode(mode)
          const currentIndex = steps.indexOf(step)
          if (currentIndex > 0) {
            set({ step: steps[currentIndex - 1] })
          }
        },

        setError: (code, message) =>
          set({
            status: { status: "error", code, message, canRetry: code !== "validation_error" },
            error: { code, message },
          }),

        clearError: () => set({ error: null, status: { status: "idle" } }),

        resetConnection: () =>
          set((state) => ({
            connection: {
              ...state.connection,
              walletId: null,
              address: null,
              pairingUri: null,
              protocol: null,
            },
          })),

        connect: async (_walletId) => {
          set({ status: { status: "connecting", walletId: _walletId } })
        },

        connectStart: (walletId) =>
          set((state) => ({
            status: { status: "connecting", walletId },
            connection: { ...state.connection, walletId },
          })),

        connectSuccess: (walletId, address) =>
          set((state) => ({
            connection: { ...state.connection, walletId, address },
          })),

        awaitingApproval: (pairingUri, protocol) =>
          set((state) => ({
            status: { status: "awaiting_approval", pairingUri, protocol },
            connection: { ...state.connection, pairingUri, protocol },
          })),

        onConnectionTimeout: () => {
          const msg = "Connection timed out. Please try again."
          set({
            status: { status: "error", code: "connection_timeout", message: msg, canRetry: true },
            error: { code: "connection_timeout", message: msg },
          })
        },

        onConnectionRejected: () => {
          const msg = "Connection was rejected."
          set({
            status: { status: "error", code: "connection_rejected", message: msg, canRetry: true },
            error: { code: "connection_rejected", message: msg },
          })
        },

        setPairingUri: (uri) =>
          set((state) => ({
            connection: { ...state.connection, pairingUri: uri },
          })),

        setRelayStatus: (status) =>
          set((state) => ({
            connection: { ...state.connection, relayStatus: status },
          })),

        sendVerificationCode: async (email, captchaToken) => {
          set({ status: { status: "sending_code" } })
          try {
            const { mode } = get()
            const response = await post<{
              success: boolean
              data: {
                verificationId: string
                expiresAt: number
                remainingAttempts: number
              }
            }>("/auth/verification/send", { email, captchaToken })
            recordMetric("auth.email.code_sent", 1, { mode })
            set((state) => ({
              emailVerification: {
                ...state.emailVerification,
                email,
                verificationId: response.data.verificationId,
                codeSent: true,
                expiresAt: response.data.expiresAt,
                remainingAttempts: response.data.remainingAttempts,
              },
              status: { status: "code_sent" },
            }))
          } catch (err) {
            const { mode } = get()
            captureAuthError(err, { step: "verify-email", mode, errorCode: "email_send_failed" })
            const msg = "Failed to send verification code. Please try again."
            set({
              status: { status: "error", code: "email_send_failed", message: msg, canRetry: true },
              error: { code: "email_send_failed", message: msg },
            })
            throw new Error(msg)
          }
        },

        verifyCode: async (code: string) => {
          if (!/^\d{6}$/.test(code)) {
            const msg = "Invalid code format."
            set({
              status: { status: "error", code: "email_code_invalid", message: msg, canRetry: false },
              error: { code: "email_code_invalid", message: msg },
            })
            throw new Error(msg)
          }

          set({ status: { status: "verifying_code" } })

          try {
            const { mode, emailVerification } = get()
            await post("/auth/verification/verify", {
              verificationId: emailVerification.verificationId,
              code,
            })
            recordMetric("auth.email.code_verified", 1, { mode })
            set((state) => ({
              emailVerification: { ...state.emailVerification, codeVerified: true },
              status: { status: "idle" },
            }))
          } catch (err: unknown) {
            const { mode } = get()
            const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }

            if (axiosErr?.response?.status === 429) {
              captureAuthError(err, { step: "verify-email", mode, errorCode: "email_rate_limited" })
              const msg = "Too many attempts. Please wait before trying again."
              set({
                status: { status: "error", code: "email_rate_limited", message: msg, canRetry: true },
                error: { code: "email_rate_limited", message: msg },
              })
              throw new Error(msg)
            }

            set((state) => ({
              emailVerification: {
                ...state.emailVerification,
                remainingAttempts: state.emailVerification.remainingAttempts - 1,
              },
            }))

            const errorMessage =
              axiosErr?.response?.data?.error ??
              (err instanceof Error ? err.message : "Invalid verification code")

            if (errorMessage.toLowerCase().includes("expired")) {
              captureAuthError(err, { step: "verify-email", mode, errorCode: "email_code_expired" })
              const msg = "Verification code has expired. Request a new one."
              set({
                status: { status: "error", code: "email_code_expired", message: msg, canRetry: false },
                error: { code: "email_code_expired", message: msg },
              })
              throw new Error(msg)
            } else {
              captureAuthError(err, { step: "verify-email", mode, errorCode: "email_code_invalid" })
              const msg = errorMessage
              set({
                status: { status: "error", code: "email_code_invalid", message: msg, canRetry: true },
                error: { code: "email_code_invalid", message: msg },
              })
              throw new Error(msg)
            }
          }
        },

        resendCode: async () => {
          const { emailVerification } = get()
          if (emailVerification.email) {
            await get().sendVerificationCode(emailVerification.email)
          }
        },

        clearEmailVerification: () => set({ emailVerification: initialEmailVerification() }),

        setCaptchaToken: (token) => set({ captchaToken: token }),

        updateProfileField: (field, value) =>
          set((state) => ({
            profile: { ...state.profile, [field]: value },
            error: null,
          })),

        setFieldError: (field, error) =>
          set((state) => {
            const next = { ...state.profile.fieldErrors }
            if (error) {
              next[field] = error
            } else {
              delete next[field]
            }
            return { profile: { ...state.profile, fieldErrors: next } }
          }),

        validateProfile: () => {
          const { profile } = get()
          const errors: Record<string, string> = {}
          if (!profile.displayName.trim()) errors.displayName = "Display name is required"
          if (!profile.email.trim()) errors.email = "Email is required"
          if (!profile.countryCode.trim()) errors.countryCode = "Country is required"
          set((state) => ({
            profile: { ...state.profile, fieldErrors: errors },
          }))
          return Object.keys(errors).length === 0
        },

        signAndSubmit: async () => {
          const state = get()
          const mode = state.mode
          const address = state.connection.address
          const walletId = state.connection.walletId

          if (!address || !walletId) {
            const msg = "No wallet connected."
            set({
              status: { status: "error", code: "internal_error", message: msg, canRetry: false },
              error: { code: "internal_error", message: msg },
            })
            return
          }

          recordMetric("wallet.sign.attempt", 1, { mode, walletId })
          set({ status: { status: "signing", address } })

          try {
            recordMetric("wallet.sign.attempt", 1, { phase: "nonce_fetch", mode })
            const nonceResponse = await post<{ nonce: string }>("/auth/nonce", {
              walletAddress: address,
            })
            const nonce = nonceResponse.nonce

            recordMetric("wallet.sign.attempt", 1, { phase: "signing", mode, walletId })
            const wallets = useMultiWalletStore.getState().wallets
            const adapter = wallets[walletId]?.adapter
            if (!adapter) {
              throw new Error("Wallet adapter not found")
            }

            const signed = await adapter.signMessage(nonce)
            const signature = signed.signature

            recordMetric("wallet.sign.success", 1, { mode, walletId })
            set({
              status: { status: "signed", signature, nonce },
              auth: { nonce, signature, nonceTimestamp: Date.now() },
            })

            recordMetric("wallet.sign.attempt", 1, { phase: "submit", mode })
            const endpoint = mode === "login" ? "/auth/verify" : "/auth/register"
            const body: Record<string, unknown> = {
              walletAddress: address,
              signature,
              nonce,
              passkeyVersion: state.passkeyVersion,
            }

            if (mode === "register") {
              const profile = state.profile
              body.displayName = profile.displayName.trim()
              if (profile.email) body.email = profile.email.trim()
              if (profile.countryCode) body.countryCode = profile.countryCode
              if (profile.language) body.preferredLanguage = profile.language
              if (state.captchaToken) body.captchaToken = state.captchaToken
              if (state.emailVerification.verificationId) body.verificationId = state.emailVerification.verificationId
            }

            const authResponse = await post<{
              success: boolean
              data: {
                token: string
                refreshToken?: string
                user: Record<string, unknown>
                expectedPasskeyVersion?: number
              }
            }>(endpoint, body)

            if (typeof window !== "undefined") {
              console.log("[signAndSubmit] raw response:", JSON.stringify(authResponse).slice(0, 500))
            }

            const d = authResponse.data
            if (!d) {
              console.error("[signAndSubmit] authResponse.data is undefined!", JSON.stringify(authResponse))
              throw new Error("Invalid response from server: missing data envelope")
            }
            if (
              d.expectedPasskeyVersion !== undefined &&
              d.expectedPasskeyVersion > state.passkeyVersion
            ) {
              set({
                passkeyVersion: d.expectedPasskeyVersion,
                passkeyRevoked: true,
              })
              const msg = "Your passkey has been revoked. Please set up a new one."
              set({
                status: { status: "error", code: "passkey_revoked", message: msg, canRetry: true },
                error: { code: "passkey_revoked", message: msg },
              })
              return
            }

            const token = d.token
            const refreshToken = d.refreshToken ?? token

            if (typeof window !== "undefined") {
              console.log("[signAndSubmit] token:", token?.slice(0, 30), "refreshToken:", refreshToken?.slice(0, 30))
            }

            useAuthStore.getState().setTokens(token, refreshToken)

            recordMetric("auth.sign.completed", 1, { mode })

            set({ status: { status: "authenticated" } })
          } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
            const errorMessage =
              axiosErr?.response?.data?.error ??
              (err instanceof Error ? err.message : "Signing failed")

            captureAuthError(err, {
              step: "sign",
              mode: get().mode,
              walletId,
              address,
              errorCode: "auth_server_error",
            })

            const msg = errorMessage
            set({
              status: { status: "error", code: "auth_server_error", message: msg, canRetry: true },
              error: { code: "auth_server_error", message: msg },
            })
          }
        },

        signStart: (address) =>
          set({ status: { status: "signing", address } }),

        signSuccess: (signature, nonce) =>
          set({
            status: { status: "signed", signature, nonce },
            auth: { nonce, signature, nonceTimestamp: Date.now() },
          }),

        authenticated: () => set({ status: { status: "authenticated" } }),

        setPasskeyVersion: (version: number) => set({ passkeyVersion: version }),

        setPasskeyRevoked: (revoked: boolean) => set({ passkeyRevoked: revoked }),

        isEmailVerified: () => get().emailVerification.codeVerified,

        isWalletConnected: () => {
          const { connection, status } = get()
          return status.status === "connected" && !!connection.address
        },

        canProceed: () => {
          const { step, emailVerification, connection, profile } = get()
          switch (step) {
            case "choose":
              return connection.address !== null
            case "verify-email":
              return emailVerification.codeVerified
            case "profile":
              return profile.displayName.trim() !== "" && profile.email.trim() !== "" && profile.countryCode.trim() !== ""
            case "sign":
              return true
          }
        },

        currentStepIndex: () => {
          const { step, mode } = get()
          return getStepsForMode(mode).indexOf(step)
        },

        totalSteps: () => getStepsForMode(get().mode).length,
      }),
      { name: "auth-flow-store" }
    ),
    {
      name: "moistello-auth-flow",
      version: 2,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        step: state.step,
        auth: state.auth,
        profile: state.profile,
        passkeyVersion: state.passkeyVersion,
        passkeyRevoked: state.passkeyRevoked,
        connection: {
          walletId: state.connection.walletId,
          address: state.connection.address,
        },
      }),
    }
  )
)

import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"
import { API_BASE_URL } from "./constants"

function getCsrfToken(): string {
  if (typeof document === "undefined") return ""
  const meta = document.querySelector('meta[name="csrf-token"]')
  const metaContent = meta?.getAttribute("content")
  if (metaContent) return metaContent

  // Fallback: derive from auth token if meta tag hasn't been populated yet
  const token = getAccessToken()
  if (!token) return ""
  return token.slice(-32)
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

function getAccessToken(): string | null {
  if (typeof document === "undefined") return null

  const cookieMatch = document.cookie.match(
    /(?:^|;\s*)moistello_token=([^;]*)/
  )
  if (cookieMatch?.[1]) return cookieMatch[1]

  try {
    return localStorage.getItem("moistello_token")
  } catch {
    return null
  }
}

function setAccessToken(token: string): void {
  if (typeof document === "undefined") return
  document.cookie = `moistello_token=${token}; path=/; max-age=86400; SameSite=Lax`
  try {
    localStorage.setItem("moistello_token", token)
  } catch (e) {
    console.warn("[api] localStorage unavailable for token storage:", e)
  }
}

let refreshInFlight: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = (async () => {
    try {
      let refreshToken: string | null = null

      if (typeof document !== "undefined") {
        const cookieMatch = document.cookie.match(
          /(?:^|;\s*)moistello_refresh=([^;]*)/
        )
        if (cookieMatch?.[1]) {
          refreshToken = cookieMatch[1]
        }

        if (!refreshToken) {
          try {
            refreshToken = localStorage.getItem("moistello_refresh")
          } catch {
            // localStorage unavailable — will throw below
          }
        }
      }

      if (!refreshToken) {
        throw new Error("No refresh token available")
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      })

      const newToken = response.data?.data?.token || response.data?.token
      if (!newToken) {
        throw new Error("No token in refresh response")
      }

      setAccessToken(newToken)
      return newToken
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const method = config.method?.toLowerCase()
    if (method && ["post", "put", "patch", "delete"].includes(method)) {
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken
      }
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          document.cookie =
            "moistello_token=; path=/; max-age=0; SameSite=Lax"
          document.cookie =
            "moistello_refresh=; path=/; max-age=0; SameSite=Lax"
          try {
            localStorage.removeItem("moistello_token")
            localStorage.removeItem("moistello_refresh")
          } catch (e) {
            console.warn("[api] Failed to clear tokens on refresh failure:", e)
          }
          // Also clear auth-store token keys so checkAuth doesn't loop
          try {
            localStorage.removeItem("moistello_access_token")
            localStorage.removeItem("moistello_refresh_token")
          } catch (e) {
            console.warn("[api] Failed to clear legacy tokens on refresh failure:", e)
          }
          window.location.href = "/login"
        }
        return Promise.reject(refreshError)
      }
    }

    if (typeof console !== "undefined") {
      const message = getErrorMessage(error)
      if (error.response?.status) {
        console.error(`[API ${error.response.status}] ${message}`)
      }
    }

    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data
    if (data?.error) return data.error
    if (data?.message) return data.message
    if (typeof data === "string") return data

    switch (error.response?.status) {
      case 400:
        return "Invalid request. Please check your inputs."
      case 401:
        return "Authentication required. Please log in."
      case 403:
        return "You do not have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 409:
        return "A conflict occurred. The resource may already exist."
      case 422:
        return "Validation failed. Please check your inputs."
      case 429:
        return "Too many requests. Please try again later."
      case 500:
        return "Internal server error. Please try again later."
      default:
        return error.message || "An unexpected error occurred."
    }
  }

  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unexpected error occurred."
}

export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(url, config)
  return response.data
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config)
  return response.data
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config)
  return response.data
}

export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config)
  return response.data
}

export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(url, config)
  return response.data
}

export { apiClient }
export default apiClient

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ApiResponse, User } from "@/types";
import { post } from "@/lib/api-client";

// ── Single source of truth for token storage ──

const ACCESS_TOKEN_KEY = "moistello_token";
const REFRESH_TOKEN_KEY = "moistello_refresh";

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(ACCESS_TOKEN_KEY) } catch { return null }
}

function setStoredAccessToken(value: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ACCESS_TOKEN_KEY, value) } catch {}
}

function removeStoredAccessToken(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(ACCESS_TOKEN_KEY) } catch {}
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(REFRESH_TOKEN_KEY) } catch { return null }
}

function setStoredRefreshToken(value: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(REFRESH_TOKEN_KEY, value) } catch {}
}

function removeStoredRefreshToken(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(REFRESH_TOKEN_KEY) } catch {}
}

// Migrate legacy keys if they exist
function migrateLegacyTokens(): void {
  if (typeof window === "undefined") return;
  const oldAccess = localStorage.getItem("moistello_access_token");
  const oldRefresh = localStorage.getItem("moistello_refresh_token");
  const newAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
  const newRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (oldAccess && !newAccess) setStoredAccessToken(oldAccess);
  if (oldRefresh && !newRefresh) setStoredRefreshToken(oldRefresh);

  try {
    if (oldAccess) localStorage.removeItem("moistello_access_token");
    if (oldRefresh) localStorage.removeItem("moistello_refresh_token");
    // Also clean up the JSON-stringified variants
    localStorage.removeItem("moistello_token"); // overwritten above if existed
    localStorage.removeItem("moistello_refresh");
  } catch {}
}

migrateLegacyTokens();

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function extractTokenExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch { return null }
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  tokenExpiresAt: number | null;
}

interface AuthActions {
  login: (walletAddress: string, signature: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string, user?: User) => void;
  clearTokens: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(devtools((set, get) => ({
  isAuthenticated: !!getStoredAccessToken(),
  user: null,
  token: getStoredAccessToken(),
  refreshToken: getStoredRefreshToken(),
  isLoading: true,
  tokenExpiresAt: null,

  login: async (walletAddress: string, signature: string) => {
    set({ isLoading: true });
    try {
      const response = await post<ApiResponse<LoginResponse>>("/auth/login", {
        walletAddress,
        signature,
      });

      const data = response.data ?? (response as unknown as LoginResponse);

      if (!data.token || !data.user) {
        throw new Error(response.error || "Authentication failed");
      }

      const { token, refreshToken, user } = data;
      const exp = extractTokenExpiry(token);

      setStoredAccessToken(token);
      setStoredRefreshToken(refreshToken);
      setCookie("moistello_token", token, 86400);

      set({
        isAuthenticated: true,
        user,
        token,
        refreshToken,
        tokenExpiresAt: exp ?? Date.now() + 15 * 60 * 1000,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    get().clearTokens()
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isLoading: false,
    })
    if (typeof window !== "undefined") {
      import("@/lib/wallet/registry").then(({ getWalletRegistry }) => {
        try { getWalletRegistry().getAdapter("passkey")?.reset?.() } catch {}
      })
    }
  },

  checkAuth: async () => {
    const token = getStoredAccessToken();
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null, refreshToken: null, isLoading: false });
      return;
    }

    // If token hasn't expired yet, skip the HTTP call
    const exp = extractTokenExpiry(token);
    if (exp && Date.now() < exp) {
      set({ isLoading: false, isAuthenticated: true, token, refreshToken: getStoredRefreshToken() });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await post<ApiResponse<{ user: User }>>("/auth/me");
      const data = response.data;
      if (!data?.user) throw new Error("Invalid session");

      const refreshToken = getStoredRefreshToken();
      const updatedExp = extractTokenExpiry(token);

      set({
        isAuthenticated: true,
        user: data.user,
        token,
        refreshToken,
        tokenExpiresAt: updatedExp ?? Date.now() + 15 * 60 * 1000,
        isLoading: false,
      });
    } catch {
      get().logout();
    }
  },

  setTokens: (accessToken: string, refreshToken: string, user?: User) => {
    setStoredAccessToken(accessToken);
    setStoredRefreshToken(refreshToken);
    setCookie("moistello_token", accessToken, 86400);
    const exp = extractTokenExpiry(accessToken);
    set({
      token: accessToken,
      refreshToken,
      tokenExpiresAt: exp ?? Date.now() + 15 * 60 * 1000,
      isAuthenticated: true,
      user: user ?? null,
    });
  },

  clearTokens: () => {
    removeStoredAccessToken();
    removeStoredRefreshToken();
    // Also clean up any legacy keys
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("moistello_access_token");
        localStorage.removeItem("moistello_refresh_token");
      } catch {}
    }
    removeCookie("moistello_token");
    removeCookie("moistello_refresh");
    set({ token: null, refreshToken: null, tokenExpiresAt: null });
  },
})));

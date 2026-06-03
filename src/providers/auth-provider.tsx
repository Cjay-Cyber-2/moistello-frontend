"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    useAuthStore.getState().checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}

"use client"

import { cn } from "@/lib/cn"

interface AuthSkeletonProps {
  className?: string
}

export function AuthSkeleton({ className }: AuthSkeletonProps) {
  return (
    <div className={cn("w-full max-w-md rounded-2xl glass border border-white/10 p-8 shadow-2xl backdrop-blur-xl", className)}>
      <div className="mb-8 flex justify-center">
        <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
      </div>

      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-xl bg-white/10" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-white/10" />
        <div className="h-10 w-3/4 animate-pulse rounded-xl bg-white/10 mx-auto" />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  )
}

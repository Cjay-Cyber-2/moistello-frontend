"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"

interface LoadingOverlayProps {
  isVisible: boolean
  text?: string
  className?: string
}

export function LoadingOverlay({
  isVisible,
  text = "Loading...",
  className,
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-label={text}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl glass border border-white/10 px-8 py-6 shadow-2xl">
        <Loader2 className="h-8 w-8 animate-spin gradient-text-extended" />
        <p className="font-body text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

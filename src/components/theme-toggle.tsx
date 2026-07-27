"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/cn"

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />
    if (theme === "dark") return <Moon className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const getLabel = () => {
    if (theme === "light") return "Light mode"
    if (theme === "dark") return "Dark mode"
    return "System theme"
  }

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full",
        "glass-whisper text-muted-foreground",
        "hover:text-foreground hover:glass-strong",
        "transition-all duration-200",
      )}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  )
}

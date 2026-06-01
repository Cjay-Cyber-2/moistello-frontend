import { type ReactNode } from "react"
import Image from "next/image"
import { QrCode, Usb, Fingerprint, Wallet, type LucideIcon } from "lucide-react"

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  walletconnect: QrCode,
  ledger: Usb,
  passkey: Fingerprint,
  freighter: Wallet,
  rabet: Wallet,
  xbull: Wallet,
  albedo: Wallet,
}

const SVG_ICONS: Record<string, string> = {}

interface GetWalletIconOptions {
  id: string
  name: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const WRAPPER_SIZE = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
}

const ICON_SIZE = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
}

export function getWalletIcon({ id, name, className, size = "md" }: GetWalletIconOptions): ReactNode {
  const LucideIcon = LUCIDE_ICONS[id]

  if (LucideIcon) {
    return (
      <span className={`flex ${WRAPPER_SIZE[size]} items-center justify-center rounded-full bg-white/10 ${className ?? ""}`}>
        <LucideIcon className={ICON_SIZE[size]} />
      </span>
    )
  }

  const svgPath = SVG_ICONS[id]
  if (svgPath) {
    return (
      <span className={`flex ${WRAPPER_SIZE[size]} items-center justify-center rounded-full bg-white/10 ${className ?? ""}`}>
        <Image src={svgPath} alt={name} width={20} height={20} className={ICON_SIZE[size]} />
      </span>
    )
  }

  return (
    <span className={`flex ${WRAPPER_SIZE[size]} items-center justify-center rounded-full bg-white/10 text-lg font-bold text-foreground ${className ?? ""}`}>
      {name ? name.charAt(0).toUpperCase() : "?"}
    </span>
  )
}

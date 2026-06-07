import type { Metadata } from "next"
import { PublicLayout } from "@/components/layout/public-layout"
import { AuthRedirect } from "@/components/shared/auth-redirect"
import { LandingContent } from "@/components/landing/landing-content"

export const metadata: Metadata = {
  title: "Moistello — Stellar Savings Circles",
  description: "Decentralized savings circles on Stellar. Sign in with passkey (Face ID / fingerprint) — your Stellar wallet is created automatically. Zero platform fees, no KYC, no email. Pure coordination software for the next billion.",
  keywords: "moistello, stellar, savings circles, ROSCA, esusu, USDC, XLM, MoiScore, reputation, soroban, smart contracts, financial inclusion, unbanked, passkey, biometric, auto-wallet, WebAuthn",
  authors: [{ name: "Nekwachukwu Ucheokoye" }],
  creator: "Moistello",
  publisher: "Moistello",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moistello.com",
    siteName: "Moistello",
    title: "Moistello — Decentralized Savings Circles on Stellar",
    description: "Join trustless passkey savings circles with zero intermediaries. Auto-created wallet, zero fees, no KYC. Built on Stellar for true financial sovereignty.",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "Moistello - Decentralized Stellar Savings Platform" }],
  },
  twitter: { card: "summary_large_image", title: "Moistello — Stellar Savings Circles", description: "Passkey savings on Stellar. Auto-wallet, zero fees, no KYC or email. Pure coordination software.", images: ["/logo.jpg"] },
}

export default function Home() {
  return (
    <>
      <PublicLayout>
        <LandingContent />
      </PublicLayout>
      <AuthRedirect />
    </>
  )
}

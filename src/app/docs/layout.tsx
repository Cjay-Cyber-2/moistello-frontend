import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation - Moistello",
  description: "Moistello documentation. Passkey-based authentication, auto-created Stellar wallets, USDC savings circles, MoiScore reputation, and Soroban smart contracts. Zero platform fees, no KYC.",
  keywords: "moistello, documentation, stellar, savings circles, USDC, XLM, MoiScore, soroban, smart contracts, ROSCA, passkey, biometric, auto-wallet, WebAuthn",
  authors: [{ name: "Nekwachukwu Ucheokoye" }],
  creator: "Moistello",
  publisher: "Moistello",
  alternates: { canonical: "/docs" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moistello.com/docs",
    siteName: "Moistello",
    title: "Documentation - Moistello",
    description: "Documentation for passkey-based savings circles on Stellar. Auto-wallet, zero fees, MoiScore reputation, and smart contracts.",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "Documentation - Moistello" }],
  },
  twitter: { card: "summary_large_image", title: "Documentation - Moistello", description: "Moistello docs — passkey auth, auto-wallet, zero fees on Stellar.", images: ["/logo.jpg"] },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
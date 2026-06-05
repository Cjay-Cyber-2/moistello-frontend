import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DOCS_DIR = path.join(process.cwd(), "content/docs")

interface DocEntry {
  slug: string
  title: string
  content: string
}

function loadAllDocs(): DocEntry[] {
  if (!fs.existsSync(DOCS_DIR)) return []

  const entries: DocEntry[] = []
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith(".md"))

  for (const file of files) {
    const raw = fs.readFileSync(path.join(DOCS_DIR, file), "utf-8")
    const parts = raw.split("---\n")
    let title = file.replace(/\.md$/, "")
    let content = raw

    if (parts.length >= 3) {
      const meta: Record<string, string> = {}
      parts[1].split("\n").forEach(line => {
        const [key, ...rest] = line.split(":")
        if (key) meta[key.trim()] = rest.join(":").trim()
      })
      title = meta.title || title
      content = parts.slice(2).join("---\n").trim()
    }

    content = content
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*`\[\]]/g, "")
      .replace(/\n+/g, " ")

    entries.push({
      slug: file.replace(/\.md$/, ""),
      title,
      content,
    })
  }

  return entries
}

const staticPages = [
  { slug: "faq", title: "FAQ", content: "passkey auth auto wallet stellar USDC zero fees MoiScore reputation savings circles ROSCA how to join create circle contribute payout" },
  { slug: "how-it-works", title: "How It Works", content: "sign in with passkey Face ID fingerprint create circle join contribute receive payout build reputation MoiScore start saving" },
  { slug: "about", title: "About", content: "mission financial inclusion Stellar blockchain open source passkey wallet no email no KYC" },
  { slug: "developers", title: "Developers", content: "API passkey auth circles contributions payouts reputation endpoints smart contracts Soroban Stellar" },
  { slug: "support", title: "Support", content: "help ticket support contact passkey wallet circle payment withdrawal" },
]

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.toLowerCase().trim()
  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const docs = loadAllDocs()
  const allPages = [
    ...docs.map(d => ({ ...d, source: "docs" as const })),
    ...staticPages.map(p => ({ ...p, source: "page" as const })),
  ]

  const terms = query.split(/\s+/).filter(Boolean)

  const scored = allPages.map(page => {
    const searchText = `${page.title} ${page.content}`.toLowerCase()
    let score = 0

    for (const term of terms) {
      const count = (searchText.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length
      score += count
      if (page.title.toLowerCase().includes(term)) score += 5
    }

    return { ...page, score }
  })

  const results = scored
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ title, slug, source, score }) => ({
      title,
      href: source === "docs" ? `/docs/${slug === "index" ? "" : slug}` : `/${slug}`,
      score,
    }))

  return NextResponse.json({ results })
}

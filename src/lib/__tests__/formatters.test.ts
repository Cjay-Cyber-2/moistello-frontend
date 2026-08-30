import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
  DEFAULT_LOCALE,
} from "@/lib/formatters"

describe("formatCurrency", () => {
  it("defaults to en-US when no locale is passed", () => {
    expect(formatCurrency(10, "NGN")).toContain("10.00")
  })

  it("localizes grouping separators", () => {
    // en-US: comma thousands, dot decimals
    expect(formatCurrency(1234.5, "NGN", "en-US")).toBe("₦1,234.50")
    // de-DE: dot thousands, comma decimals (symbol position varies by ICU)
    expect(formatCurrency(1234.5, "NGN", "de-DE")).toContain("1.234,50")
    expect(formatCurrency(1234.5, "NGN", "de-DE")).toContain("₦")
  })

  it("renders XLM as a plain localized number, not a currency symbol", () => {
    expect(formatCurrency(1.234567, "XLM", "en-US")).toBe("1.2346 XLM")
  })
})

describe("formatDate", () => {
  it("honors the active locale month names", () => {
    const d = new Date("2024-03-05T12:00:00Z")
    expect(formatDate(d, undefined, "en-US")).toMatch(/Mar/)
    expect(formatDate(d, undefined, "fr")).toMatch(/mars/i)
  })

  it("honors explicit options while overriding locale", () => {
    const d = new Date("2024-03-05T12:00:00Z")
    expect(
      formatDate(d, { year: "numeric", month: "long", day: "numeric" }, "fr")
    ).toMatch(/2024/)
  })
})

describe("formatNumber", () => {
  it("groups according to the active locale", () => {
    expect(formatNumber(1234567, "en-US")).toBe("1,234,567")
    expect(formatNumber(1234567, "de-DE")).toBe("1.234.567")
  })

  it("defaults to DEFAULT_LOCALE", () => {
    expect(formatNumber(1000)).toBe(formatNumber(1000, DEFAULT_LOCALE))
  })
})

describe("formatRelativeTime", () => {
  it("returns an English relative string by default", () => {
    const s = formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000))
    expect(typeof s).toBe("string")
    expect(s.length).toBeGreaterThan(0)
  })
})
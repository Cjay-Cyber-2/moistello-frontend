import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import GlobalError from "./global-error"

describe("GlobalError", () => {
  const error = new Error("Sensitive internal error")
  const reset = vi.fn()

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("renders the stack or message in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.spyOn(console, "error").mockImplementation(() => undefined)

    const { container } = render(<GlobalError error={error} reset={reset} />)

    expect(container.querySelector("pre")?.textContent).toBe(error.stack || error.message)
  })

  it("renders a friendly message and logs the error in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    render(<GlobalError error={error} reset={reset} />)

    expect(screen.getByText("Something went wrong. Please try again later.")).not.toBeNull()
    expect(consoleError).toHaveBeenCalledWith("GlobalError caught:", error)
  })

  it("does not expose the stack or internal message in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.spyOn(console, "error").mockImplementation(() => undefined)

    render(<GlobalError error={error} reset={reset} />)

    expect(screen.queryByText(error.message)).toBeNull()
    expect(document.body.textContent).not.toContain(error.stack)
  })
})

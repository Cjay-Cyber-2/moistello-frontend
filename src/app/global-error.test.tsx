import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import GlobalError from "./global-error"

describe("GlobalError", () => {
  it("keeps error internals private and exposes a safe recovery action", () => {
    const reset = vi.fn()
    const error = Object.assign(new Error("private database failure"), {
      digest: "safe-reference",
      stack: "secret stack trace",
    })

    render(<GlobalError error={error} reset={reset} />)

    expect(screen.queryByText(/private database failure/i)).toBeNull()
    expect(screen.queryByText(/secret stack trace/i)).toBeNull()
    expect(screen.getByText(/safe-reference/i)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })
})

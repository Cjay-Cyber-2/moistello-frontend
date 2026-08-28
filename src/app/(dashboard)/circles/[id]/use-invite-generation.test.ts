import { describe, expect, it, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useInviteGeneration } from "./use-invite-generation"

const postMock = vi.fn()
vi.mock("@/lib/api-client", () => ({ post: (...args: unknown[]) => postMock(...args) }))
vi.mock("@/lib/clipboard", () => ({ copyToClipboard: vi.fn(() => Promise.resolve(true)) }))

describe("useInviteGeneration", () => {
  beforeEach(() => {
    postMock.mockReset()
  })

  it("opens the modal and stores the generated code", async () => {
    postMock.mockResolvedValueOnce({ data: { invite: { code: "ABC123" } } })
    const { result } = renderHook(() => useInviteGeneration("circle-1"))

    await act(async () => {
      await result.current.generate()
    })

    expect(postMock).toHaveBeenCalledWith(
      "/circles/circle-1/invites",
      { maxUses: 10, ttlHours: 24 },
    )
    expect(result.current.isOpen).toBe(true)
    expect(result.current.code).toBe("ABC123")
    expect(result.current.isError).toBe(false)
  })

  it("records an error state when generation fails", async () => {
    postMock.mockRejectedValueOnce(new Error("boom"))
    const { result } = renderHook(() => useInviteGeneration("circle-1"))

    await act(async () => {
      await result.current.generate()
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe("boom")
  })

  it("resets code and closes on close()", async () => {
    postMock.mockResolvedValueOnce({ data: { invite: { code: "ABC123" } } })
    const { result } = renderHook(() => useInviteGeneration("circle-1"))

    await act(async () => {
      await result.current.generate()
    })
    act(() => result.current.close())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.code).toBe("")
  })

  it("sets copied to true after copy()", async () => {
    const { result } = renderHook(() => useInviteGeneration("circle-1"))

    await act(async () => {
      await result.current.copy()
    })

    await waitFor(() => expect(result.current.copied).toBe(true))
  })
})

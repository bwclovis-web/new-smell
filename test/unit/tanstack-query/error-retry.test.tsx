/**
 * Tests for TanStack Query Error States and Retry Logic
 * 
 * Tests error handling, retry behavior, and error recovery
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useHouses } from "~/hooks/useHouses"
import { usePerfumesByLetter } from "~/hooks/usePerfumesByLetter"

// Mock fetch
global.fetch = vi.fn()

describe("TanStack Query Error States and Retries", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 2, // Retry 2 times for testing
          retryDelay: 100, // Fast retry for testing
        },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe("Error States", () => {
    it("should set error state when query fails", async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useHouses({}), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe("Network error")
    })

    it("should handle 404 errors correctly", async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ error: "Not found" }),
      })

      const { result } = renderHook(() => usePerfumesByLetter("Z", "all"), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })

    it("should handle 500 server errors correctly", async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ error: "Server error" }),
      })

      const { result } = renderHook(() => useHouses({}), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe("Retry Logic", () => {
    it("should retry failed queries", async () => {
      let callCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount < 2) {
          return Promise.reject(new Error("Network error"))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ houses: [] }),
        })
      })

      const { result } = renderHook(() => useHouses({}), { wrapper })

      await waitFor(
        () => {
          expect(result.current.isSuccess).toBe(true)
        },
        { timeout: 2000 }
      )

      // Should have retried (callCount > 1)
      expect(callCount).toBeGreaterThan(1)
    })

    it("should not retry on 4xx client errors", async () => {
      let callCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({ error: "Bad request" }),
        })
      })

      const { result } = renderHook(() => useHouses({}), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should not retry 4xx errors (only called once)
      expect(callCount).toBe(1)
    })

    it("should stop retrying after max retries", async () => {
      let callCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        return Promise.reject(new Error("Network error"))
      })

      const { result } = renderHook(() => useHouses({}), { wrapper })

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true)
        },
        { timeout: 2000 }
      )

      // Should have retried up to max retries (2) + initial attempt = 3 total
      expect(callCount).toBe(3)
    })
  })

  describe("Error Recovery", () => {
    it("should allow refetch after error", async () => {
      ;(global.fetch as any)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ houses: [{ id: "1", name: "House 1" }] }),
        })

      const { result } = renderHook(() => useHouses({}), { wrapper })

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Refetch
      result.current.refetch()

      // Should recover
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
    })

    it("should reset error state on successful refetch", async () => {
      ;(global.fetch as any)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ houses: [] }),
        })

      const { result } = renderHook(() => useHouses({}), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      result.current.refetch()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.isError).toBe(false)
      })
    })
  })
})


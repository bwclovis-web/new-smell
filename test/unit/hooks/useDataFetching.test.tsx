/**
 * Tests for useDataFetching hook
 *
 * @group unit
 * @group hooks
 * @group data-fetching
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useDataFetching } from "~/hooks/useDataFetching"

// Mock useApiWithRetry
vi.mock("~/hooks/useApiWithRetry", () => ({
  useApiWithRetry: () => ({
    fetchWithRetry: vi.fn(async fn => {
      try {
        return await fn()
      } catch (error) {
        throw error
      }
    }),
  }),
}))

describe("useDataFetching", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = vi.fn()
  })

  describe("Basic Fetching", () => {
    it("should fetch data successfully", async () => {
      const mockData = { id: 1, name: "Test" }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const { result } = renderHook(() => useDataFetching({ url: "/api/test" }))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isInitialLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
      expect(result.current.isError).toBe(false)
    })

    it("should handle fetch errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      const { result } = renderHook(() => useDataFetching({ url: "/api/test" }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).not.toBeNull()
      expect(result.current.isError).toBe(true)
    })

    it("should use custom fetch function", async () => {
      const mockData = { custom: "data" }
      const fetchFn = vi.fn().mockResolvedValue(mockData)

      const { result } = renderHook(() => useDataFetching({ fetchFn }))

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      expect(fetchFn).toHaveBeenCalled()
    })

    it("should not fetch when enabled is false", async () => {
      global.fetch = vi.fn()

      const { result } = renderHook(() => useDataFetching({ url: "/api/test", enabled: false }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe("Caching", () => {
    it("should cache data in localStorage", async () => {
      const mockData = { id: 1, name: "Cached" }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const { result } = renderHook(() => useDataFetching({
          url: "/api/test",
          cacheKey: "test-cache",
        }))

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      const cached = localStorage.getItem("data-fetch-test-cache")
      expect(cached).toBeTruthy()

      const parsed = JSON.parse(cached!)
      expect(parsed.data).toEqual(mockData)
      expect(parsed.timestamp).toBeGreaterThan(0)
    })

    it("should use cached data on subsequent renders", async () => {
      const mockData = { id: 1, name: "Cached" }
      const timestamp = Date.now()

      localStorage.setItem(
        "data-fetch-test-cache",
        JSON.stringify({ data: mockData, timestamp })
      )

      global.fetch = vi.fn()

      const { result } = renderHook(() => useDataFetching({
          url: "/api/test",
          cacheKey: "test-cache",
          cacheDuration: 600000, // 10 minutes
        }))

      // Should load from cache immediately
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      expect(result.current.isInitialLoading).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it("should refetch when cache is expired", async () => {
      const oldData = { id: 1, name: "Old" }
      const newData = { id: 2, name: "New" }
      const expiredTimestamp = Date.now() - 600000 // 10 minutes ago

      localStorage.setItem(
        "data-fetch-test-cache",
        JSON.stringify({ data: oldData, timestamp: expiredTimestamp })
      )

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => newData,
      })

      const { result } = renderHook(() => useDataFetching({
          url: "/api/test",
          cacheKey: "test-cache",
          cacheDuration: 300000, // 5 minutes
        }))

      await waitFor(() => {
        expect(result.current.data).toEqual(newData)
      })

      expect(global.fetch).toHaveBeenCalled()
    })

    it("should support stale-while-revalidate", async () => {
      const cachedData = { id: 1, name: "Cached" }
      const freshData = { id: 2, name: "Fresh" }

      localStorage.setItem(
        "data-fetch-test-cache",
        JSON.stringify({ data: cachedData, timestamp: Date.now() })
      )

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => freshData,
      })

      const { result } = renderHook(() => useDataFetching({
          url: "/api/test",
          cacheKey: "test-cache",
          staleWhileRevalidate: true,
        }))

      // Should show cached data immediately
      await waitFor(() => {
        expect(result.current.data).toEqual(cachedData)
      })

      // Then refetch in background
      await waitFor(() => {
        expect(result.current.data).toEqual(freshData)
      })
    })

    it("should clear cache", async () => {
      const mockData = { id: 1, name: "Test" }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const { result } = renderHook(() => useDataFetching({
          url: "/api/test",
          cacheKey: "test-cache",
        }))

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      expect(localStorage.getItem("data-fetch-test-cache")).toBeTruthy()

      act(() => {
        result.current.clearCache()
      })

      expect(localStorage.getItem("data-fetch-test-cache")).toBeNull()
    })
  })

  describe("Dependencies", () => {
    it("should refetch when dependencies change", async () => {
      const mockData1 = { id: 1 }
      const mockData2 = { id: 2 }

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData2,
        })

      let filter = "test1"
      const { result, rerender } = renderHook(
        ({ filter }) => useDataFetching({
            url: `/api/test?filter=${filter}`,
            deps: [filter],
          }),
        { initialProps: { filter } }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1)
      })

      // Change dependency
      filter = "test2"
      rerender({ filter })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2)
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe("Debouncing", () => {
    it("should debounce fetch requests", async () => {
      const mockData = { id: 1 }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      let search = "test"
      const { rerender } = renderHook(
        ({ search }) => useDataFetching({
            url: `/api/search?q=${search}`,
            deps: [search],
            debounceMs: 500,
          }),
        { initialProps: { search } }
      )

      // Rapidly change search
      search = "test1"
      rerender({ search })
      search = "test2"
      rerender({ search })
      search = "test3"
      rerender({ search })

      // Wait for debounce
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledTimes(1)
        },
        { timeout: 1000 }
      )
    })
  })

  describe("Transform", () => {
    it("should transform response data", async () => {
      const mockData = { items: [1, 2, 3] }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const { result } = renderHook(() => useDataFetching({
          url: "/api/test",
          transform: (data: typeof mockData) => data.items,
        }))

      await waitFor(() => {
        expect(result.current.data).toEqual([1, 2, 3])
      })
    })
  })

  describe("Callbacks", () => {
    it("should call onSuccess callback", async () => {
      const mockData = { id: 1 }
      const onSuccess = vi.fn()

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      renderHook(() => useDataFetching({
          url: "/api/test",
          onSuccess,
        }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData)
      })
    })

    it("should call onError callback", async () => {
      const onError = vi.fn()

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      renderHook(() => useDataFetching({
          url: "/api/test",
          onError,
        }))

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe("Refetch", () => {
    it("should refetch data manually", async () => {
      const mockData1 = { id: 1 }
      const mockData2 = { id: 2 }

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData2,
        })

      const { result } = renderHook(() => useDataFetching({ url: "/api/test" }))

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1)
      })

      await act(async () => {
        await result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2)
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it("should set isRefetching when refetching with existing data", async () => {
      const mockData = { id: 1 }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const { result } = renderHook(() => useDataFetching({ url: "/api/test" }))

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      act(() => {
        result.current.refetch()
      })

      expect(result.current.isRefetching).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe("Error Handling", () => {
    it("should clear error state", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useDataFetching({ url: "/api/test" }))

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.isError).toBe(false)
    })
  })

  describe("URL Function", () => {
    it("should support URL as a function", async () => {
      const mockData = { id: 1 }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const getUrl = vi.fn(() => "/api/dynamic")

      const { result } = renderHook(() => useDataFetching({ url: getUrl }))

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      expect(getUrl).toHaveBeenCalled()
    })
  })

  describe("Manual Data Update", () => {
    it("should allow manual data updates", async () => {
      const mockData = { id: 1 }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const { result } = renderHook(() => useDataFetching({ url: "/api/test" }))

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      const newData = { id: 2 }
      act(() => {
        result.current.setData(newData)
      })

      expect(result.current.data).toEqual(newData)
    })
  })

  describe("Abort Controller", () => {
    it("should abort ongoing requests on unmount", async () => {
      let aborted = false
      global.fetch = vi.fn().mockImplementation(() => new Promise((resolve, reject) => {
            setTimeout(() => {
              if (aborted) {
                reject(new Error("AbortError"))
              } else {
                resolve({
                  ok: true,
                  json: async () => ({ id: 1 }),
                })
              }
            }, 1000)
          }))

      const { unmount } = renderHook(() => useDataFetching({ url: "/api/test" }))

      // Unmount before fetch completes
      unmount()
      aborted = true

      // Wait to ensure no errors
      await new Promise(resolve => setTimeout(resolve, 100))
    })
  })
})

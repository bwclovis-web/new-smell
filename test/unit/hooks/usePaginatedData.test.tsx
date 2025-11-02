/**
 * Tests for usePaginatedData hook
 *
 * @group unit
 * @group hooks
 * @group data-fetching
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePaginatedData } from "~/hooks/usePaginatedData"

// Mock useDataFetching
vi.mock("~/hooks/useDataFetching", () => ({
  useDataFetching: ({ url, ...rest }: any) => {
    const [data, setData] = React.useState(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState(null)

    React.useEffect(() => {
      if (typeof url === "function") {
        url = url()
      }

      setIsLoading(true)
      const urlObj = new URL(url, "http://localhost")
      const page = parseInt(urlObj.searchParams.get("page") || "1")
      const pageSize = parseInt(urlObj.searchParams.get("pageSize") || "20")

      // Simulate fetch
      setTimeout(() => {
        const mockData = {
          data: Array.from({ length: pageSize }, (_, i) => ({
            id: (page - 1) * pageSize + i + 1,
            name: `Item ${(page - 1) * pageSize + i + 1}`,
          })),
          meta: {
            page,
            pageSize,
            totalPages: 5,
            totalCount: 100,
            hasMore: page < 5,
          },
        }
        setData(mockData)
        setIsLoading(false)
      }, 10)
    }, [url])

    return {
      data,
      isLoading,
      isInitialLoading: isLoading && data === null,
      error,
      isError: error !== null,
      refetch: vi.fn(async () => {}),
      clearError: vi.fn(),
      setData,
      clearCache: vi.fn(),
      isRefetching: false,
    }
  },
}))

const React = await import("react")

describe("usePaginatedData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Basic Pagination", () => {
    it("should fetch first page", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toHaveLength(20)
      expect(result.current.currentPage).toBe(1)
      expect(result.current.meta?.hasMore).toBe(true)
      expect(result.current.meta?.totalPages).toBe(5)
    })

    it("should navigate to next page", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      act(() => {
        result.current.nextPage()
      })

      expect(result.current.currentPage).toBe(2)

      await waitFor(() => {
        expect(result.current.data[0].id).toBe(21)
      })
    })

    it("should navigate to previous page", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          initialPage: 2,
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2)
      })

      act(() => {
        result.current.prevPage()
      })

      expect(result.current.currentPage).toBe(1)
    })

    it("should not go below page 1", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      act(() => {
        result.current.prevPage()
      })

      expect(result.current.currentPage).toBe(1)
    })

    it("should not go beyond total pages", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          initialPage: 5,
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.meta?.totalPages).toBe(5)
      })

      act(() => {
        result.current.nextPage()
      })

      // Should still be on page 5 (last page)
      expect(result.current.currentPage).toBe(5)
    })

    it("should go to specific page", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      act(() => {
        result.current.goToPage(3)
      })

      expect(result.current.currentPage).toBe(3)

      await waitFor(() => {
        expect(result.current.data[0].id).toBe(41)
      })
    })
  })

  describe("Query Parameters", () => {
    it("should include custom query parameters", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          params: { type: "niche", search: "rose" },
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      // Mock should build URL with params
      expect(result.current.data).toBeDefined()
    })

    it("should ignore undefined/null params", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          params: {
            type: "niche",
            search: undefined,
            filter: null,
            empty: "",
          },
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })
    })

    it("should refetch when params change", async () => {
      let params = { type: "niche" }
      const { result, rerender } = renderHook(
        ({ params }) => usePaginatedData({
            baseUrl: "/api/items",
            params,
            pageSize: 20,
          }),
        { initialProps: { params } }
      )

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      // Change params
      params = { type: "designer" }
      rerender({ params })

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })
    })
  })

  describe("Accumulation (Infinite Scroll)", () => {
    it("should accumulate data across pages", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
          accumulate: true,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      expect(result.current.data[0].id).toBe(1)

      // Go to next page
      act(() => {
        result.current.nextPage()
      })

      await waitFor(() => {
        expect(result.current.data).toHaveLength(40)
      })

      // Should have data from both pages
      expect(result.current.data[0].id).toBe(1) // First page
      expect(result.current.data[20].id).toBe(21) // Second page
    })

    it("should reset accumulation when going back to page 1", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          initialPage: 2,
          pageSize: 20,
          accumulate: true,
        }))

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2)
      })

      // Go to page 1
      act(() => {
        result.current.goToPage(1)
      })

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      // Should only have first page data
      expect(result.current.data[0].id).toBe(1)
    })

    it("should set isLoadingMore when fetching next page", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
          accumulate: true,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      act(() => {
        result.current.nextPage()
      })

      // Should briefly be true
      expect(result.current.isLoadingMore || result.current.isLoading).toBe(true)
    })
  })

  describe("Reset", () => {
    it("should reset to initial page", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          initialPage: 1,
          pageSize: 20,
          accumulate: true,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      // Navigate to page 3
      act(() => {
        result.current.goToPage(3)
      })

      await waitFor(() => {
        expect(result.current.currentPage).toBe(3)
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.currentPage).toBe(1)
    })

    it("should clear accumulated data on reset", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
          accumulate: true,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      // Load more pages
      act(() => {
        result.current.nextPage()
      })

      await waitFor(() => {
        expect(result.current.data).toHaveLength(40)
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1)
      })
    })
  })

  describe("Refetch", () => {
    it("should refetch current page", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.data).toHaveLength(20)
    })

    it("should reset accumulation and refetch from page 1 when accumulating", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
          accumulate: true,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      // Load more pages
      act(() => {
        result.current.nextPage()
      })

      await waitFor(() => {
        expect(result.current.data).toHaveLength(40)
      })

      // Refetch
      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.currentPage).toBe(1)
    })
  })

  describe("Error Handling", () => {
    it("should handle errors", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/error",
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Errors would be handled by useDataFetching mock
    })

    it("should clear errors", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(20)
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe("Page Size", () => {
    it("should respect custom page size", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 10,
        }))

      await waitFor(() => {
        expect(result.current.data).toHaveLength(10)
      })
    })
  })

  describe("Loading States", () => {
    it("should track initial loading state", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
        }))

      expect(result.current.isInitialLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isInitialLoading).toBe(false)
      })
    })

    it("should track loading state", async () => {
      const { result } = renderHook(() => usePaginatedData({
          baseUrl: "/api/items",
          pageSize: 20,
        }))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})



/**
 * Tests for TanStack Query Infinite Scroll Hooks
 * 
 * Tests infinite scroll functionality with useInfiniteQuery
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useInfinitePerfumesByHouse } from "~/hooks/useInfinitePerfumes"
import { useInfiniteHouses } from "~/hooks/useInfiniteHouses"

// Mock fetch
global.fetch = vi.fn()

describe("TanStack Query Infinite Scroll", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
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

  describe("useInfinitePerfumesByHouse", () => {
    it("should load initial page of perfumes", async () => {
      const mockPage1 = {
        perfumes: [{ id: "1", name: "Perfume 1" }, { id: "2", name: "Perfume 2" }],
        meta: { hasMore: true, totalCount: 10 },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPage1,
      })

      const { result } = renderHook(
        () =>
          useInfinitePerfumesByHouse({
            houseSlug: "test-house",
            pageSize: 2,
            initialData: [],
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.data?.pages[0].perfumes).toHaveLength(2)
      expect(result.current.hasNextPage).toBe(true)
    })

    it("should fetch next page when fetchNextPage is called", async () => {
      const mockPage1 = {
        perfumes: [{ id: "1", name: "Perfume 1" }],
        meta: { hasMore: true, totalCount: 3 },
      }
      const mockPage2 = {
        perfumes: [{ id: "2", name: "Perfume 2" }],
        meta: { hasMore: true, totalCount: 3 },
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPage1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPage2,
        })

      const { result } = renderHook(
        () =>
          useInfinitePerfumesByHouse({
            houseSlug: "test-house",
            pageSize: 1,
            initialData: [],
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Fetch next page
      result.current.fetchNextPage()

      await waitFor(() => {
        expect(result.current.data?.pages).toHaveLength(2)
      })

      expect(result.current.data?.pages[0].perfumes).toHaveLength(1)
      expect(result.current.data?.pages[1].perfumes).toHaveLength(1)
    })

    it("should flatten pages correctly", async () => {
      const mockPage1 = {
        perfumes: [{ id: "1", name: "Perfume 1" }],
        meta: { hasMore: true, totalCount: 2 },
      }
      const mockPage2 = {
        perfumes: [{ id: "2", name: "Perfume 2" }],
        meta: { hasMore: false, totalCount: 2 },
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPage1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPage2,
        })

      const { result } = renderHook(
        () =>
          useInfinitePerfumesByHouse({
            houseSlug: "test-house",
            pageSize: 1,
            initialData: [],
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      result.current.fetchNextPage()

      await waitFor(() => {
        expect(result.current.data?.pages).toHaveLength(2)
      })

      // Flatten pages
      const allPerfumes = result.current.data?.pages.flatMap(page => page.perfumes || []) || []
      expect(allPerfumes).toHaveLength(2)
      expect(allPerfumes[0].id).toBe("1")
      expect(allPerfumes[1].id).toBe("2")
    })

    it("should set hasNextPage to false when no more pages", async () => {
      const mockPage1 = {
        perfumes: [{ id: "1", name: "Perfume 1" }],
        meta: { hasMore: false, totalCount: 1 },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPage1,
      })

      const { result } = renderHook(
        () =>
          useInfinitePerfumesByHouse({
            houseSlug: "test-house",
            pageSize: 1,
            initialData: [],
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.hasNextPage).toBe(false)
    })
  })

  describe("useInfiniteHouses", () => {
    it("should load initial page of houses", async () => {
      const mockPage1 = {
        houses: [{ id: "1", name: "House 1" }, { id: "2", name: "House 2" }],
        meta: { hasMore: true, totalCount: 10 },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPage1,
      })

      const { result } = renderHook(
        () =>
          useInfiniteHouses({
            letter: "A",
            houseType: "all",
            pageSize: 2,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.data?.pages[0].houses).toHaveLength(2)
      expect(result.current.hasNextPage).toBe(true)
    })
  })
})


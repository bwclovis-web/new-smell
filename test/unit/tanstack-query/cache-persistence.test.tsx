/**
 * Tests for TanStack Query Cache Persistence
 * 
 * Tests cache persistence across navigation and component remounts
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useHouses } from "~/hooks/useHouses"
import { usePerfume } from "~/hooks/usePerfume"
import { queryKeys } from "~/lib/queries/houses"
import { queryKeys as perfumeQueryKeys } from "~/lib/queries/perfumes"

// Mock fetch
global.fetch = vi.fn()

describe("TanStack Query Cache Persistence", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
        },
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

  describe("Cache Persistence Across Component Remounts", () => {
    it("should use cached data when component remounts", async () => {
      const mockData = { houses: [{ id: "1", name: "House 1" }] }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      // First render - should fetch
      const { result, unmount } = renderHook(() => useHouses({}), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Unmount component
      unmount()

      // Second render - should use cache
      const { result: result2 } = renderHook(() => useHouses({}), { wrapper })

      // Should have data immediately (from cache)
      expect(result2.current.data).toBeDefined()

      // Should not fetch again (data is still fresh)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("should refetch when data becomes stale", async () => {
      const mockData = { houses: [{ id: "1", name: "House 1" }] }

      // Create query client with short stale time for testing
      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 100, // 100ms for testing
            gcTime: 1000,
          },
        },
      })

      const testWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
      )

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ houses: [{ id: "1", name: "House 1 Updated" }] }),
        })

      // First render
      const { result, unmount } = renderHook(() => useHouses({}), { wrapper: testWrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      unmount()

      // Wait for data to become stale
      await new Promise(resolve => setTimeout(resolve, 150))

      // Second render - should refetch because data is stale
      const { result: result2 } = renderHook(() => useHouses({}), { wrapper: testWrapper })

      await waitFor(() => {
        expect(result2.current.isFetching).toBe(false)
      })

      // Should have fetched twice (initial + refetch)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe("Cache Persistence Across Navigation", () => {
    it("should persist cache when navigating between routes", async () => {
      const mockHouses = { houses: [{ id: "1", name: "House 1" }] }
      const mockPerfume = { id: "1", name: "Perfume 1" }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHouses,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPerfume,
        })

      // Fetch houses (simulating navigation to houses page)
      const { result: housesResult, unmount: unmountHouses } = renderHook(
        () => useHouses({}),
        { wrapper }
      )

      await waitFor(() => {
        expect(housesResult.current.isSuccess).toBe(true)
      })

      // Check cache
      const housesCache = queryClient.getQueryData(queryKeys.houses.all)
      expect(housesCache).toBeDefined()

      unmountHouses()

      // Fetch perfume (simulating navigation to perfume page)
      const { result: perfumeResult, unmount: unmountPerfume } = renderHook(
        () => usePerfume("perfume-1", mockPerfume),
        { wrapper }
      )

      await waitFor(() => {
        expect(perfumeResult.current.isSuccess).toBe(true)
      })

      unmountPerfume()

      // Navigate back to houses - should use cache
      const { result: housesResult2 } = renderHook(() => useHouses({}), { wrapper })

      // Should have data immediately from cache
      expect(housesResult2.current.data).toBeDefined()

      // Houses query should still be in cache
      const housesCache2 = queryClient.getQueryData(queryKeys.houses.all)
      expect(housesCache2).toBeDefined()

      // Perfume query should also be in cache
      const perfumeCache = queryClient.getQueryData(perfumeQueryKeys.perfumes.detail("perfume-1"))
      expect(perfumeCache).toBeDefined()
    })

    it("should maintain separate cache entries for different queries", async () => {
      const mockHousesA = { houses: [{ id: "1", name: "House A" }] }
      const mockHousesB = { houses: [{ id: "2", name: "House B" }] }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHousesA,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHousesB,
        })

      // Fetch houses with filter A
      const { result: resultA, unmount: unmountA } = renderHook(
        () => useHouses({ houseType: "niche" }),
        { wrapper }
      )

      await waitFor(() => {
        expect(resultA.current.isSuccess).toBe(true)
      })

      unmountA()

      // Fetch houses with filter B
      const { result: resultB, unmount: unmountB } = renderHook(
        () => useHouses({ houseType: "designer" }),
        { wrapper }
      )

      await waitFor(() => {
        expect(resultB.current.isSuccess).toBe(true)
      })

      unmountB()

      // Both should be in cache with different keys
      const cacheA = queryClient.getQueryData(queryKeys.houses.list({ houseType: "niche" }))
      const cacheB = queryClient.getQueryData(queryKeys.houses.list({ houseType: "designer" }))

      expect(cacheA).toBeDefined()
      expect(cacheB).toBeDefined()
      expect(cacheA).not.toBe(cacheB)
    })
  })

  describe("Cache Garbage Collection", () => {
    it("should remove unused cache after gcTime", async () => {
      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 0,
            gcTime: 100, // 100ms for testing
          },
        },
      })

      const testWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
      )

      const mockData = { houses: [{ id: "1", name: "House 1" }] }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      // Fetch and unmount
      const { result, unmount } = renderHook(() => useHouses({}), { wrapper: testWrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check cache exists
      const cacheBefore = testQueryClient.getQueryData(queryKeys.houses.all)
      expect(cacheBefore).toBeDefined()

      unmount()

      // Wait for garbage collection
      await new Promise(resolve => setTimeout(resolve, 150))

      // Cache should be removed
      const cacheAfter = testQueryClient.getQueryData(queryKeys.houses.all)
      expect(cacheAfter).toBeUndefined()
    })
  })
})


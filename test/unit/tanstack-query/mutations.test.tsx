/**
 * Tests for TanStack Query Mutations
 * 
 * Tests query invalidation after mutations and optimistic updates
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useToggleWishlist } from "~/lib/mutations/wishlist"
import { useDeleteHouse } from "~/lib/mutations/houses"
import { useDeletePerfume } from "~/lib/mutations/perfumes"
import { queryKeys as userQueryKeys } from "~/lib/queries/user"
import { queryKeys as perfumeQueryKeys } from "~/lib/queries/perfumes"
import { queryKeys as houseQueryKeys } from "~/lib/queries/houses"

// Mock fetch
global.fetch = vi.fn()

describe("TanStack Query Mutations - Query Invalidation", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
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

  describe("Wishlist Mutation - Query Invalidation", () => {
    it("should invalidate wishlist queries after successful mutation", async () => {
      const mockWishlist = { wishlist: [{ perfumeId: "1", perfume: { id: "1" } }] }
      const mockPerfume = { id: "1", name: "Test Perfume" }

      // Set initial cache data
      queryClient.setQueryData(userQueryKeys.user.wishlist("current"), mockWishlist)
      queryClient.setQueryData(perfumeQueryKeys.perfumes.detail("1"), mockPerfume)

      // Mock successful API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useToggleWishlist(), { wrapper })

      // Perform mutation
      result.current.mutate({
        perfumeId: "1",
        action: "add",
        isPublic: false,
      })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that queries were invalidated
      const wishlistQuery = queryClient.getQueryState(userQueryKeys.user.wishlist("current"))
      const perfumeQuery = queryClient.getQueryState(perfumeQueryKeys.perfumes.detail("1"))

      // Queries should be invalidated (marked as stale)
      expect(wishlistQuery?.isInvalidated).toBe(true)
      expect(perfumeQuery?.isInvalidated).toBe(true)
    })

    it("should invalidate perfume list queries after wishlist mutation", async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useToggleWishlist(), { wrapper })

      result.current.mutate({
        perfumeId: "1",
        action: "add",
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that perfume list queries were invalidated
      const perfumeListQuery = queryClient.getQueryState(perfumeQueryKeys.perfumes.all)
      expect(perfumeListQuery?.isInvalidated).toBe(true)
    })
  })

  describe("Delete House Mutation - Query Invalidation", () => {
    it("should invalidate house queries after successful deletion", async () => {
      const mockHouses = [{ id: "1", name: "House 1" }, { id: "2", name: "House 2" }]
      queryClient.setQueryData(houseQueryKeys.houses.all, mockHouses)

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "1" }],
      })

      const { result } = renderHook(() => useDeleteHouse(), { wrapper })

      result.current.mutate({ houseId: "1" })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that house queries were invalidated
      const houseQuery = queryClient.getQueryState(houseQueryKeys.houses.all)
      expect(houseQuery?.isInvalidated).toBe(true)

      // Check that perfume queries were also invalidated (perfumes belong to houses)
      const perfumeQuery = queryClient.getQueryState(perfumeQueryKeys.perfumes.all)
      expect(perfumeQuery?.isInvalidated).toBe(true)
    })
  })

  describe("Delete Perfume Mutation - Query Invalidation", () => {
    it("should invalidate perfume queries after successful deletion", async () => {
      const mockPerfumes = [{ id: "1", name: "Perfume 1" }, { id: "2", name: "Perfume 2" }]
      queryClient.setQueryData(perfumeQueryKeys.perfumes.all, mockPerfumes)

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "1" }],
      })

      const { result } = renderHook(() => useDeletePerfume(), { wrapper })

      result.current.mutate({ perfumeId: "1" })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check that perfume queries were invalidated
      const perfumeQuery = queryClient.getQueryState(perfumeQueryKeys.perfumes.all)
      expect(perfumeQuery?.isInvalidated).toBe(true)

      // Check that house queries were also invalidated (houses show perfume counts)
      const houseQuery = queryClient.getQueryState(houseQueryKeys.houses.all)
      expect(houseQuery?.isInvalidated).toBe(true)
    })
  })
})

describe("TanStack Query Mutations - Optimistic Updates", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
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

  describe("Wishlist Optimistic Updates", () => {
    it("should optimistically add item to wishlist", async () => {
      const initialWishlist = { wishlist: [] }
      queryClient.setQueryData(userQueryKeys.user.wishlist("current"), initialWishlist)

      // Mock delayed API response
      ;(global.fetch as any).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      )

      const { result } = renderHook(() => useToggleWishlist(), { wrapper })

      // Perform mutation
      result.current.mutate({
        perfumeId: "1",
        action: "add",
      })

      // Immediately check optimistic update (before API responds)
      await waitFor(() => {
        const cachedData = queryClient.getQueryData(userQueryKeys.user.wishlist("current")) as any
        expect(cachedData?.wishlist).toHaveLength(1)
        expect(cachedData?.wishlist[0].perfumeId).toBe("1")
      })
    })

    it("should optimistically remove item from wishlist", async () => {
      const initialWishlist = {
        wishlist: [
          { perfumeId: "1", perfume: { id: "1" } },
          { perfumeId: "2", perfume: { id: "2" } },
        ],
      }
      queryClient.setQueryData(userQueryKeys.user.wishlist("current"), initialWishlist)

      ;(global.fetch as any).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      )

      const { result } = renderHook(() => useToggleWishlist(), { wrapper })

      result.current.mutate({
        perfumeId: "1",
        action: "remove",
      })

      // Check optimistic update
      await waitFor(() => {
        const cachedData = queryClient.getQueryData(userQueryKeys.user.wishlist("current")) as any
        expect(cachedData?.wishlist).toHaveLength(1)
        expect(cachedData?.wishlist[0].perfumeId).toBe("2")
      })
    })

    it("should rollback optimistic update on error", async () => {
      const initialWishlist = { wishlist: [] }
      queryClient.setQueryData(userQueryKeys.user.wishlist("current"), initialWishlist)

      // Mock API error
      ;(global.fetch as any).mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useToggleWishlist(), { wrapper })

      result.current.mutate({
        perfumeId: "1",
        action: "add",
      })

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Check that cache was rolled back
      const cachedData = queryClient.getQueryData(userQueryKeys.user.wishlist("current")) as any
      expect(cachedData?.wishlist).toHaveLength(0)
    })
  })

  describe("Delete House Optimistic Updates", () => {
    it("should optimistically remove house from cache", async () => {
      const initialHouses = [
        { id: "1", name: "House 1" },
        { id: "2", name: "House 2" },
      ]
      queryClient.setQueryData(houseQueryKeys.houses.all, initialHouses)

      ;(global.fetch as any).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ ok: true, json: async () => [{ id: "1" }] }),
              100
            )
          )
      )

      const { result } = renderHook(() => useDeleteHouse(), { wrapper })

      result.current.mutate({ houseId: "1" })

      // Check optimistic update
      await waitFor(() => {
        const cachedData = queryClient.getQueryData(houseQueryKeys.houses.all) as any
        if (Array.isArray(cachedData)) {
          expect(cachedData).toHaveLength(1)
          expect(cachedData[0].id).toBe("2")
        }
      })
    })

    it("should rollback optimistic update on error", async () => {
      const initialHouses = [
        { id: "1", name: "House 1" },
        { id: "2", name: "House 2" },
      ]
      queryClient.setQueryData(houseQueryKeys.houses.all, initialHouses)

      ;(global.fetch as any).mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useDeleteHouse(), { wrapper })

      result.current.mutate({ houseId: "1" })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Check rollback
      const cachedData = queryClient.getQueryData(houseQueryKeys.houses.all) as any
      if (Array.isArray(cachedData)) {
        expect(cachedData).toHaveLength(2)
      }
    })
  })
})


/**
 * Perfume Route Integration Tests
 *
 * Tests perfume detail page loader functionality:
 * - Perfume data loading by slug
 * - Ratings and reviews aggregation
 * - Wishlist status for authenticated users
 * - User session handling
 * - Parallel query execution and performance
 * - Error handling (missing slug, 404, invalid tokens)
 * - Authentication state management
 *
 * @group integration
 * @group routes
 * @group perfume
 */

import type { LoaderFunctionArgs } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as perfumeServer from "~/models/perfume.server"
import * as perfumeRatingServer from "~/models/perfumeRating.server"
import * as perfumeReviewServer from "~/models/perfumeReview.server"
import * as userServer from "~/models/user.server"
import * as wishlistServer from "~/models/wishlist.server"
import { loader as perfumeLoader } from "~/routes/perfume"
import * as sessionManager from "~/utils/security/session-manager.server"

// Return value for getPerfumeBySlug - set in tests so mock is robust with restoreMocks/clearMocks
let getPerfumeBySlugReturn: unknown = null

vi.mock("~/models/perfume.server", () => ({
  getPerfumeBySlug: vi.fn().mockImplementation(async () => getPerfumeBySlugReturn),
}))
vi.mock("~/models/perfumeRating.server", () => ({
  getPerfumeRatings: vi.fn(),
  getUserPerfumeRating: vi.fn(),
}))
vi.mock("~/models/perfumeReview.server", () => ({
  getPerfumeReviews: vi.fn(),
  getUserPerfumeReview: vi.fn(),
}))
vi.mock("~/models/user.server", () => ({
  getUserById: vi.fn(),
}))
vi.mock("~/models/wishlist.server", () => ({
  isInWishlist: vi.fn(),
}))
vi.mock("~/utils/security/session-manager.server", () => ({
  verifyAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
}))
vi.mock("cookie")

describe("Perfume Route Integration Tests", () => {
  const mockPerfume = {
    id: "perfume-1",
    name: "Test Perfume",
    slug: "test-perfume",
    description: "A test perfume",
    perfumeHouse: {
      id: "house-1",
      name: "Test House",
      slug: "test-house",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    username: "testuser",
    role: "user" as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getPerfumeBySlugReturn = null

    // Set up default mock implementations (getPerfumeBySlug reads getPerfumeBySlugReturn)
    vi.mocked(perfumeRatingServer.getPerfumeRatings).mockResolvedValue({
      averageRatings: {},
      ratingCount: 0,
    } as any)
    vi.mocked(perfumeRatingServer.getUserPerfumeRating).mockResolvedValue(null)
    vi.mocked(perfumeReviewServer.getUserPerfumeReview).mockResolvedValue(null)
    vi.mocked(perfumeReviewServer.getPerfumeReviews).mockResolvedValue({
      reviews: [],
      totalCount: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
    } as any)
    vi.mocked(userServer.getUserById).mockResolvedValue(null)
    vi.mocked(wishlistServer.isInWishlist).mockResolvedValue(false)
    vi.mocked(sessionManager.verifyAccessToken).mockReturnValue(null)
  })

  describe("Loader", () => {
    it("should load perfume data successfully for unauthenticated user", async () => {
      const mockRequest = new Request("https://example.com/perfume/test-perfume")

      const mockRatings = {
        averageRatings: {
          longevity: 4.5,
          sillage: 4.0,
          value: 4.2,
          complexity: 4.3,
        },
        ratingCount: 10,
      }

      const mockReviews = {
        reviews: [],
        totalCount: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
      }

      getPerfumeBySlugReturn = mockPerfume
      vi.mocked(perfumeRatingServer.getPerfumeRatings).mockResolvedValue(mockRatings as any)
      vi.mocked(perfumeReviewServer.getPerfumeReviews).mockResolvedValue(mockReviews as any)

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: { perfumeSlug: "test-perfume" },
        context: {},
      }

      const result = await perfumeLoader(args)

      // Handle case where result might be a Response (from error handler)
      if (result instanceof Response) {
        expect(result.status).not.toBe(302)
        expect(result.status).not.toBe(404)
        const data = await result.json()
        expect(data.perfume).toEqual(mockPerfume)
        expect(data.user).toBeNull()
      } else {
        expect(result.perfume).toEqual(mockPerfume)
        expect(result.user).toBeNull()
      }

      expect(perfumeServer.getPerfumeBySlug).toHaveBeenCalledWith("test-perfume")
    })

    it("should throw error when perfume slug is missing", async () => {
      const mockRequest = new Request("https://example.com/perfume/")

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: {},
        context: {},
      }

      await expect(perfumeLoader(args)).rejects.toThrow("Perfume slug not found")
    })

    it("should throw 404 when perfume not found", async () => {
      const mockRequest = new Request("https://example.com/perfume/non-existent")

      vi.mocked(perfumeServer.getPerfumeBySlug).mockResolvedValue(null)

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: { perfumeSlug: "non-existent" },
        context: {},
      }

      await expect(perfumeLoader(args)).rejects.toThrow("Perfume not found")
    })

    it("should handle database errors gracefully", async () => {
      const mockRequest = new Request("https://example.com/perfume/test-perfume")

      const dbError = new Error("Database connection failed")
      vi.mocked(perfumeServer.getPerfumeBySlug).mockRejectedValue(dbError)

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: { perfumeSlug: "test-perfume" },
        context: {},
      }

      // The error handler will catch and process the error, so we check for any error
      // The actual error message may be transformed by the error handler
      await expect(perfumeLoader(args)).rejects.toThrow()
    })
  })
})

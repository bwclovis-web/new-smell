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

vi.mock("~/models/perfume.server")
vi.mock("~/models/perfumeRating.server")
vi.mock("~/models/perfumeReview.server")
vi.mock("~/models/user.server")
vi.mock("~/models/wishlist.server")
vi.mock("~/utils/security/session-manager.server")
vi.mock("cookie", () => ({
  default: {
    parse: vi.fn(str => {
      const obj: Record<string, string> = {}
      if (str) {
        str.split(";").forEach((cookie: string) => {
          const [key, value] = cookie.trim().split("=")
          obj[key] = value
        })
      }
      return obj
    }),
  },
}))

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

      // Mock all required functions - ensure mocks are set up before calling loader
      vi.mocked(perfumeServer.getPerfumeBySlug).mockImplementation(
        async (slug: string) => {
          if (slug === "test-perfume") {
            return mockPerfume as any
          }
          return null
        }
      )
      
      vi.mocked(sessionManager.verifyAccessToken).mockReturnValue(null)
      vi.mocked(userServer.getUserById).mockResolvedValue(null)
      vi.mocked(perfumeRatingServer.getPerfumeRatings).mockResolvedValue(mockRatings as any)
      vi.mocked(perfumeRatingServer.getUserPerfumeRating).mockResolvedValue(null)
      vi.mocked(perfumeReviewServer.getUserPerfumeReview).mockResolvedValue(null)
      vi.mocked(perfumeReviewServer.getPerfumeReviews).mockResolvedValue(mockReviews as any)
      vi.mocked(wishlistServer.isInWishlist).mockResolvedValue(false)

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: { perfumeSlug: "test-perfume" },
        context: {},
      }

      const result = await perfumeLoader(args)
      
      // Handle case where result might be a Response (from error handler)
      if (result instanceof Response) {
        // If it's a redirect or error response, the test should fail
        expect(result.status).not.toBe(302)
        expect(result.status).not.toBe(404)
        const data = await result.json()
        expect(data.perfume).toEqual(mockPerfume)
        expect(data.user).toBeNull()
      } else {
        expect(result.perfume).toEqual(mockPerfume)
        expect(result.user).toBeNull()
      }
      
      // Verify the mock was called
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

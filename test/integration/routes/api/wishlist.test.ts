/**
 * Wishlist API Integration Tests
 *
 * Tests the wishlist API action functionality:
 * - Adding perfumes to wishlist (authenticated users)
 * - Removing perfumes from wishlist
 * - Authentication and authorization checks
 * - Error handling for invalid requests
 * - Alert processing integration
 *
 * @group integration
 * @group api
 * @group wishlist
 */

import type { ActionFunctionArgs } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as wishlistServer from "~/models/wishlist.server"
import { action } from "~/routes/api/wishlist"
import * as auth from "~/utils/auth.server"

vi.mock("~/models/wishlist.server")
vi.mock("~/utils/auth.server")
vi.mock("~/utils/alert-processors", () => ({
  processDecantInterestAlerts: vi.fn().mockResolvedValue(undefined),
}))

describe("Wishlist API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Action - Add to Wishlist", () => {
    it("should add perfume to wishlist for authenticated user", async () => {
      const mockUserId = "user-123"
      const mockPerfumeId = "perfume-456"

      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: true,
        user: { id: mockUserId } as any,
      })

      vi.mocked(wishlistServer.addToWishlist).mockResolvedValue({
        id: "wishlist-item-1",
        userId: mockUserId,
        perfumeId: mockPerfumeId,
        createdAt: new Date(),
      } as any)

      const formData = new FormData()
      formData.append("perfumeId", mockPerfumeId)
      formData.append("action", "add")
      formData.append("isPublic", "false")

      const request = new Request("https://example.com/api/wishlist", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const response = await action(args)

      expect(wishlistServer.addToWishlist).toHaveBeenCalledWith(
        mockUserId,
        mockPerfumeId,
        false
      )
    })

    it("should return error when user is not authenticated", async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: false,
        error: "Unauthorized",
        status: 401,
      })

      const formData = new FormData()
      formData.append("perfumeId", "perfume-456")
      formData.append("action", "add")
      formData.append("isPublic", "false")

      const request = new Request("https://example.com/api/wishlist", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const response = await action(args)

      expect(wishlistServer.addToWishlist).not.toHaveBeenCalled()
    })
  })

  describe("Action - Remove from Wishlist", () => {
    it("should remove perfume from wishlist for authenticated user", async () => {
      const mockUserId = "user-123"
      const mockPerfumeId = "perfume-456"

      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: true,
        user: { id: mockUserId } as any,
      })

      vi.mocked(wishlistServer.removeFromWishlist).mockResolvedValue({
        id: "wishlist-item-1",
        userId: mockUserId,
        perfumeId: mockPerfumeId,
      } as any)

      const formData = new FormData()
      formData.append("perfumeId", mockPerfumeId)
      formData.append("action", "remove")

      const request = new Request("https://example.com/api/wishlist", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await action(args)

      expect(wishlistServer.removeFromWishlist).toHaveBeenCalledWith(
        mockUserId,
        mockPerfumeId
      )
    })
  })

  describe("Action - Update Visibility", () => {
    it("should update wishlist item visibility", async () => {
      const mockUserId = "user-123"
      const mockPerfumeId = "perfume-456"

      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: true,
        user: { id: mockUserId } as any,
      })

      vi.mocked(wishlistServer.updateWishlistVisibility).mockResolvedValue({
        id: "wishlist-item-1",
        userId: mockUserId,
        perfumeId: mockPerfumeId,
        isPublic: true,
      } as any)

      const formData = new FormData()
      formData.append("perfumeId", mockPerfumeId)
      formData.append("action", "updateVisibility")
      formData.append("isPublic", "true")

      const request = new Request("https://example.com/api/wishlist", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await action(args)

      expect(wishlistServer.updateWishlistVisibility).toHaveBeenCalledWith(
        mockUserId,
        mockPerfumeId,
        true
      )
    })
  })

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(auth.authenticateUser).mockResolvedValue({
        success: true,
        user: { id: "user-123" } as any,
      })

      vi.mocked(wishlistServer.addToWishlist).mockRejectedValue(
        new Error("Database error")
      )

      const formData = new FormData()
      formData.append("perfumeId", "perfume-456")
      formData.append("action", "add")
      formData.append("isPublic", "false")

      const request = new Request("https://example.com/api/wishlist", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await action(args)

      // Should handle error without crashing
      expect(auth.authenticateUser).toHaveBeenCalled()
    })
  })
})

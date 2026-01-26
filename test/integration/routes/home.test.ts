/**
 * Home Route Integration Tests
 *
 * Tests the home route loader functionality, including:
 * - Feature loading and data fetching
 * - Error handling and edge cases
 * - Integration with feature.server model
 *
 * @group integration
 * @group routes
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { prisma } from "~/db.server"
import * as featureServer from "~/models/feature.server"
import { loader as homeLoader } from "~/routes/home"

vi.mock("~/models/feature.server")
vi.mock("~/db.server", () => ({
  prisma: {
    user: {
      count: vi.fn(),
    },
    perfumeHouse: {
      count: vi.fn(),
    },
    perfume: {
      count: vi.fn(),
    },
  },
}))

describe("Home Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
  })

  describe("Loader", () => {
    it("should load features successfully", async () => {
      const mockFeatures = [
        {
          id: "1",
          title: "Feature 1",
          description: "Description 1",
          icon: "icon1",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          title: "Feature 2",
          description: "Description 2",
          icon: "icon2",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(featureServer.getAllFeatures).mockClear().mockResolvedValue(mockFeatures)
      vi.mocked(prisma.user.count).mockResolvedValue(10)
      vi.mocked(prisma.perfumeHouse.count).mockResolvedValue(5)
      vi.mocked(prisma.perfume.count).mockResolvedValue(100)

      const result = await homeLoader()

      expect(result).toEqual({
        features: mockFeatures,
        counts: {
          users: 10,
          houses: 5,
          perfumes: 100,
        },
      })
      expect(featureServer.getAllFeatures).toHaveBeenCalledTimes(1)
    })

    it("should handle empty features list", async () => {
      vi.mocked(featureServer.getAllFeatures).mockClear().mockResolvedValue([])
      vi.mocked(prisma.user.count).mockResolvedValue(0)
      vi.mocked(prisma.perfumeHouse.count).mockResolvedValue(0)
      vi.mocked(prisma.perfume.count).mockResolvedValue(0)

      const result = await homeLoader()

      expect(result).toEqual({
        features: [],
        counts: {
          users: 0,
          houses: 0,
          perfumes: 0,
        },
      })
    })

    it("should handle errors gracefully", async () => {
      vi.mocked(featureServer.getAllFeatures).mockClear().mockRejectedValue(new Error("Database error"))

      await expect(homeLoader()).rejects.toThrow("Database error")
    })

    it("should call getAllFeatures once per load", async () => {
      const mockFeatures = [
        {
          id: "1",
          title: "Feature 1",
          description: "Description 1",
          icon: "icon1",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(featureServer.getAllFeatures).mockClear().mockResolvedValue(mockFeatures)
      vi.mocked(prisma.user.count).mockResolvedValue(10)
      vi.mocked(prisma.perfumeHouse.count).mockResolvedValue(5)
      vi.mocked(prisma.perfume.count).mockResolvedValue(100)

      await homeLoader()
      await homeLoader()

      expect(featureServer.getAllFeatures).toHaveBeenCalledTimes(2)
    })
  })

  describe("Error Handling", () => {
    it("should propagate network errors", async () => {
      vi.mocked(featureServer.getAllFeatures).mockClear().mockRejectedValue(new Error("Network error"))

      await expect(homeLoader()).rejects.toThrow("Network error")
    })

    it("should propagate database connection errors", async () => {
      vi.mocked(featureServer.getAllFeatures).mockClear().mockRejectedValue(new Error("Database connection failed"))

      await expect(homeLoader()).rejects.toThrow("Database connection failed")
    })
  })
})

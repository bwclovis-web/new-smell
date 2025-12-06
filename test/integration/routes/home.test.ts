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

import * as featureServer from "~/models/feature.server"
import { loader as homeLoader } from "~/routes/home"

vi.mock("~/models/feature.server")

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

      const result = await homeLoader()

      expect(result).toEqual({ features: mockFeatures })
      expect(featureServer.getAllFeatures).toHaveBeenCalledTimes(1)
    })

    it("should handle empty features list", async () => {
      vi.mocked(featureServer.getAllFeatures).mockClear().mockResolvedValue([])

      const result = await homeLoader()

      expect(result).toEqual({ features: [] })
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

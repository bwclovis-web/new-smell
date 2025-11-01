/**
 * Perfume Factory Tests
 * Tests for perfume test data factory functions
 */

import { describe, expect, it } from "vitest"

import {
  createMockPerfume,
  createMockPerfumes,
  createMockPerfumesForHouse,
  perfumeFactoryPresets,
} from "../../factories/perfume.factory"

describe("Perfume Factory", () => {
  describe("createMockPerfume", () => {
    it("should create a perfume with default values", () => {
      const perfume = createMockPerfume()

      expect(perfume).toHaveProperty("id")
      expect(perfume).toHaveProperty("name")
      expect(perfume).toHaveProperty("slug")
      expect(perfume).toHaveProperty("description")
      expect(perfume).toHaveProperty("image")
      expect(perfume).toHaveProperty("perfumeHouseId")
      expect(perfume).toHaveProperty("perfumeHouse")
      expect(perfume).toHaveProperty("createdAt")
      expect(perfume).toHaveProperty("updatedAt")
    })

    it("should create a perfume with a house by default", () => {
      const perfume = createMockPerfume()

      expect(perfume.perfumeHouseId).toBeTruthy()
      expect(perfume.perfumeHouse).toBeTruthy()
      expect(perfume.perfumeHouse!.id).toBe(perfume.perfumeHouseId)
    })

    it("should create a perfume with overridden values", () => {
      const overrides = {
        id: "test-perfume-id",
        name: "Test Perfume",
        slug: "test-perfume",
      }
      const perfume = createMockPerfume(overrides)

      expect(perfume.id).toBe("test-perfume-id")
      expect(perfume.name).toBe("Test Perfume")
      expect(perfume.slug).toBe("test-perfume")
    })

    it("should generate valid slugs from names", () => {
      const perfume = createMockPerfume({ name: "Test Perfume Name" })

      expect(perfume.slug).toMatch(/^[a-z0-9-]+$/)
      expect(perfume.slug).not.toContain(" ")
      expect(perfume.slug).toBe(perfume.slug.toLowerCase())
    })

    it("should handle null perfumeHouseId", () => {
      const perfume = createMockPerfume({
        perfumeHouseId: null,
        perfumeHouse: null,
      })

      expect(perfume.perfumeHouseId).toBeNull()
      expect(perfume.perfumeHouse).toBeNull()
    })

    it("should use provided perfumeHouseId", () => {
      const houseId = "custom-house-id"
      const perfume = createMockPerfume({ perfumeHouseId: houseId })

      expect(perfume.perfumeHouseId).toBe(houseId)
      expect(perfume.perfumeHouse!.id).toBe(houseId)
    })

    it("should generate unique IDs by default", () => {
      const perfume1 = createMockPerfume()
      const perfume2 = createMockPerfume()

      expect(perfume1.id).not.toBe(perfume2.id)
    })

    it("should generate realistic descriptions with notes", () => {
      const perfume = createMockPerfume()

      expect(perfume.description).toBeTruthy()
      expect(perfume.description).toContain("Top Notes:")
      expect(perfume.description).toContain("Heart Notes:")
      expect(perfume.description).toContain("Base Notes:")
    })
  })

  describe("createMockPerfumes", () => {
    it("should create multiple perfumes", () => {
      const perfumes = createMockPerfumes(5)

      expect(perfumes).toHaveLength(5)
      expect(perfumes[0]!.id).toBe("perfume-1")
      expect(perfumes[4]!.id).toBe("perfume-5")
    })

    it("should apply overrides to all perfumes", () => {
      const perfumes = createMockPerfumes(3, { image: null })

      perfumes.forEach((perfume) => {
        expect(perfume.image).toBeNull()
      })
    })

    it("should create perfumes with unique names when not overridden", () => {
      const perfumes = createMockPerfumes(3, {})

      const names = perfumes.map((p) => p.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(3)
    })
  })

  describe("createMockPerfumesForHouse", () => {
    it("should create perfumes for a specific house", () => {
      const houseId = "test-house-1"
      const perfumes = createMockPerfumesForHouse(houseId, 3)

      expect(perfumes).toHaveLength(3)
      perfumes.forEach((perfume) => {
        expect(perfume.perfumeHouseId).toBe(houseId)
        expect(perfume.perfumeHouse!.id).toBe(houseId)
      })
    })

    it("should apply overrides to all perfumes for house", () => {
      const houseId = "test-house-1"
      const perfumes = createMockPerfumesForHouse(houseId, 3, {
        description: null,
      })

      perfumes.forEach((perfume) => {
        expect(perfume.perfumeHouseId).toBe(houseId)
        expect(perfume.description).toBeNull()
      })
    })
  })

  describe("perfumeFactoryPresets", () => {
    it("should create a classic perfume with designer house", () => {
      const classic = perfumeFactoryPresets.classicPerfume()

      expect(classic.name).toMatch(/No\. \d+/)
      expect(classic.perfumeHouse!.type).toBe("designer")
    })

    it("should create a niche perfume with niche house", () => {
      const niche = perfumeFactoryPresets.nichePerfume()

      expect(niche.perfumeHouse!.type).toBe("niche")
    })

    it("should create an indie perfume with indie house", () => {
      const indie = perfumeFactoryPresets.indiePerfume()

      expect(indie.perfumeHouse!.type).toBe("indie")
    })

    it("should create an orphaned perfume without house", () => {
      const orphaned = perfumeFactoryPresets.orphanedPerfume()

      expect(orphaned.perfumeHouseId).toBeNull()
      expect(orphaned.perfumeHouse).toBeNull()
    })

    it("should create a minimal perfume with null fields", () => {
      const minimal = perfumeFactoryPresets.minimalPerfume()

      expect(minimal.name).toBeTruthy()
      expect(minimal.slug).toBeTruthy()
      expect(minimal.description).toBeNull()
      expect(minimal.image).toBeNull()
      expect(minimal.perfumeHouseId).toBeNull()
    })

    it("should create a recent perfume with recent dates", () => {
      const recent = perfumeFactoryPresets.recentPerfume()

      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      expect(recent.createdAt.getTime()).toBeGreaterThan(oneDayAgo.getTime())
    })

    it("should create a perfume with special characters in name", () => {
      const special = perfumeFactoryPresets.specialCharPerfume()

      expect(special.name).toContain("'")
      expect(special.name).toContain("&")
      expect(special.slug).not.toContain("'")
      expect(special.slug).not.toContain("&")
      expect(special.slug).toMatch(/^[a-z0-9-]+$/)
    })

    it("should create a perfume with long description", () => {
      const longDesc = perfumeFactoryPresets.longDescriptionPerfume()

      expect(longDesc.description!.length).toBeGreaterThan(1000)
    })

    it("should create a perfume without image", () => {
      const noImage = perfumeFactoryPresets.noImagePerfume()

      expect(noImage.image).toBeNull()
    })
  })

  describe("Data Validation", () => {
    it("should have updatedAt after or equal to createdAt", () => {
      const perfume = createMockPerfume()

      expect(perfume.updatedAt.getTime()).toBeGreaterThanOrEqual(
        perfume.createdAt.getTime()
      )
    })

    it("should handle custom dates correctly", () => {
      const customCreatedAt = new Date("2020-01-01")
      const customUpdatedAt = new Date("2023-01-01")

      const perfume = createMockPerfume({
        createdAt: customCreatedAt,
        updatedAt: customUpdatedAt,
      })

      expect(perfume.createdAt).toBe(customCreatedAt)
      expect(perfume.updatedAt).toBe(customUpdatedAt)
    })

    it("should generate valid image URLs when present", () => {
      const perfume = createMockPerfume()

      if (perfume.image) {
        expect(perfume.image).toMatch(/^https?:\/\//)
      }
    })
  })
})

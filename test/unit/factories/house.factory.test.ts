/**
 * House Factory Tests
 * Tests for perfume house test data factory functions
 */

import { describe, expect, it } from "vitest"

import {
  createMockHouse,
  createMockHouses,
  houseFactoryPresets,
} from "../../factories/house.factory"

describe("House Factory", () => {
  describe("createMockHouse", () => {
    it("should create a house with default values", () => {
      const house = createMockHouse()

      expect(house).toHaveProperty("id")
      expect(house).toHaveProperty("name")
      expect(house).toHaveProperty("slug")
      expect(house).toHaveProperty("description")
      expect(house).toHaveProperty("image")
      expect(house).toHaveProperty("website")
      expect(house).toHaveProperty("country")
      expect(house).toHaveProperty("founded")
      expect(house).toHaveProperty("email")
      expect(house).toHaveProperty("phone")
      expect(house).toHaveProperty("address")
      expect(house).toHaveProperty("type")
      expect(house).toHaveProperty("createdAt")
      expect(house).toHaveProperty("updatedAt")
    })

    it("should create a house with overridden values", () => {
      const overrides = {
        id: "test-house-id",
        name: "Test House",
        slug: "test-house",
        type: "niche" as const,
      }
      const house = createMockHouse(overrides)

      expect(house.id).toBe("test-house-id")
      expect(house.name).toBe("Test House")
      expect(house.slug).toBe("test-house")
      expect(house.type).toBe("niche")
    })

    it("should generate valid slugs from names", () => {
      const house = createMockHouse({ name: "Test House Name" })

      expect(house.slug).toMatch(/^[a-z0-9-]+$/)
      expect(house.slug).not.toContain(" ")
      expect(house.slug).toBe(house.slug.toLowerCase())
    })

    it("should handle null optional fields", () => {
      const house = createMockHouse({
        description: null,
        image: null,
        website: null,
        country: null,
        founded: null,
        email: null,
        phone: null,
        address: null,
      })

      expect(house.description).toBeNull()
      expect(house.image).toBeNull()
      expect(house.website).toBeNull()
      expect(house.country).toBeNull()
      expect(house.founded).toBeNull()
      expect(house.email).toBeNull()
      expect(house.phone).toBeNull()
      expect(house.address).toBeNull()
    })

    it("should generate unique IDs by default", () => {
      const house1 = createMockHouse()
      const house2 = createMockHouse()

      expect(house1.id).not.toBe(house2.id)
    })

    it("should generate valid house types", () => {
      const validTypes = [
"niche", "designer", "indie", "celebrity", "drugstore"
]

      for (let i = 0; i < 10; i++) {
        const house = createMockHouse()
        expect(validTypes).toContain(house.type)
      }
    })
  })

  describe("createMockHouses", () => {
    it("should create multiple houses", () => {
      const houses = createMockHouses(5)

      expect(houses).toHaveLength(5)
      expect(houses[0]!.id).toBe("house-1")
      expect(houses[4]!.id).toBe("house-5")
    })

    it("should apply overrides to all houses", () => {
      const houses = createMockHouses(3, { type: "niche", country: "France" })

      houses.forEach(house => {
        expect(house.type).toBe("niche")
        expect(house.country).toBe("France")
      })
    })

    it("should create houses with unique names when not overridden", () => {
      const houses = createMockHouses(3, {})

      const names = houses.map(h => h.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(3)
    })
  })

  describe("houseFactoryPresets", () => {
    it("should create a niche house with correct type", () => {
      const niche = houseFactoryPresets.nicheHouse()

      expect(niche.type).toBe("niche")
      expect(niche.country).toBe("France")
      expect(niche.name).toContain("Maison")
    })

    it("should create a designer house with correct type", () => {
      const designer = houseFactoryPresets.designerHouse()

      expect(designer.type).toBe("designer")
      expect(["France", "Italy", "USA"]).toContain(designer.country)
    })

    it("should create an indie house with correct type", () => {
      const indie = houseFactoryPresets.indieHouse()

      expect(indie.type).toBe("indie")
      expect(["USA", "UK", "Canada"]).toContain(indie.country)
    })

    it("should create a celebrity house with correct type", () => {
      const celebrity = houseFactoryPresets.celebrityHouse()

      expect(celebrity.type).toBe("celebrity")
      expect(celebrity.name).toContain("Fragrances")
    })

    it("should create a minimal house with null fields", () => {
      const minimal = houseFactoryPresets.minimalHouse()

      expect(minimal.name).toBeTruthy()
      expect(minimal.slug).toBeTruthy()
      expect(minimal.description).toBeNull()
      expect(minimal.image).toBeNull()
      expect(minimal.website).toBeNull()
    })

    it("should create a historic house with old founding date", () => {
      const historic = houseFactoryPresets.historicHouse()

      expect(historic.type).toBe("designer")
      expect(historic.country).toBe("France")

      const foundedYear = parseInt(historic.founded!, 10)
      expect(foundedYear).toBeLessThan(new Date().getFullYear() - 100)
    })

    it("should create a house with special characters in name", () => {
      const special = houseFactoryPresets.specialCharHouse()

      expect(special.name).toContain("'")
      expect(special.name).toContain("&")
      expect(special.slug).not.toContain("'")
      expect(special.slug).not.toContain("&")
      expect(special.slug).toMatch(/^[a-z0-9-]+$/)
    })

    it("should create a house with long description", () => {
      const longDesc = houseFactoryPresets.longDescriptionHouse()

      expect(longDesc.description!.length).toBeGreaterThan(500)
    })
  })

  describe("Data Validation", () => {
    it("should generate valid URLs when present", () => {
      const house = createMockHouse()

      if (house.website) {
        expect(house.website).toMatch(/^https?:\/\//)
      }
    })

    it("should generate valid email addresses when present", () => {
      const house = createMockHouse()

      if (house.email) {
        expect(house.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      }
    })

    it("should have updatedAt after or equal to createdAt", () => {
      const house = createMockHouse()

      expect(house.updatedAt.getTime()).toBeGreaterThanOrEqual(house.createdAt.getTime())
    })

    it("should generate valid founded years when present", () => {
      const house = createMockHouse()

      if (house.founded) {
        const year = parseInt(house.founded, 10)
        const currentYear = new Date().getFullYear()
        expect(year).toBeGreaterThan(1700)
        expect(year).toBeLessThanOrEqual(currentYear)
      }
    })

    it("should handle custom dates correctly", () => {
      const customCreatedAt = new Date("2020-01-01")
      const customUpdatedAt = new Date("2023-01-01")

      const house = createMockHouse({
        createdAt: customCreatedAt,
        updatedAt: customUpdatedAt,
      })

      expect(house.createdAt).toBe(customCreatedAt)
      expect(house.updatedAt).toBe(customUpdatedAt)
    })
  })
})

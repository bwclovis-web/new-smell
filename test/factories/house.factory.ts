/**
 * Perfume House Test Data Factory
 * Generates realistic perfume house data for testing using @faker-js/faker
 */

import { faker } from "@faker-js/faker"
import type { HouseType } from "@prisma/client"

import type { PerfumeHouse } from "~/types/database"

/**
 * Options for creating a mock perfume house
 */
export interface CreateMockHouseOptions {
  id?: string
  name?: string
  slug?: string
  description?: string | null
  image?: string | null
  website?: string | null
  country?: string | null
  founded?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  type?: HouseType
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Creates a mock PerfumeHouse with realistic data
 * @param overrides - Optional field overrides
 * @returns Mock PerfumeHouse object
 */
export function createMockHouse(overrides: CreateMockHouseOptions = {}): Omit<PerfumeHouse, "perfumes"> {
  const name = overrides.name ?? faker.company.name()
  const slug = overrides.slug ?? faker.helpers.slugify(name).toLowerCase()

  return {
    id: overrides.id ?? faker.string.uuid(),
    name,
    slug,
    description:
      overrides.description !== undefined
        ? overrides.description
        : faker.commerce.productDescription(),
    image:
      overrides.image !== undefined
        ? overrides.image
        : faker.image.url({ width: 800, height: 600 }),
    website:
      overrides.website !== undefined ? overrides.website : faker.internet.url(),
    country:
      overrides.country !== undefined ? overrides.country : faker.location.country(),
    founded:
      overrides.founded !== undefined
        ? overrides.founded
        : faker.date.past({ years: 50 }).getFullYear().toString(),
    email: overrides.email !== undefined ? overrides.email : faker.internet.email(),
    phone: overrides.phone !== undefined ? overrides.phone : faker.phone.number(),
    address:
      overrides.address !== undefined
        ? overrides.address
        : faker.location.streetAddress({ useFullAddress: true }),
    type:
      overrides.type ??
      faker.helpers.arrayElement<HouseType>([
        "niche",
        "designer",
        "indie",
        "celebrity",
        "drugstore",
      ]),
    createdAt: overrides.createdAt ?? faker.date.past({ years: 2 }),
    updatedAt: overrides.updatedAt ?? faker.date.recent({ days: 30 }),
  }
}

/**
 * Creates multiple mock perfume houses
 * @param count - Number of houses to create
 * @param overrides - Optional field overrides for all houses
 * @returns Array of mock PerfumeHouse objects
 */
export function createMockHouses(
  count: number,
  overrides: CreateMockHouseOptions = {}
): Array<Omit<PerfumeHouse, "perfumes">> {
  return Array.from({ length: count }, (_, i) => createMockHouse({
      ...overrides,
      id: overrides.id ?? `house-${i + 1}`,
    }))
}

/**
 * Creates a mock house with specific test scenarios
 */
export const houseFactoryPresets = {

  /**
   * Luxury niche perfume house
   */
  nicheHouse: (): ReturnType<typeof createMockHouse> => createMockHouse({
      type: "niche",
      country: "France",
      founded: "1990",
      name: `Maison ${faker.person.lastName()}`,
    }),

  /**
   * Designer perfume house
   */
  designerHouse: (): ReturnType<typeof createMockHouse> => createMockHouse({
      type: "designer",
      country: faker.helpers.arrayElement(["France", "Italy", "USA"]),
      founded: faker.date.past({ years: 100 }).getFullYear().toString(),
    }),

  /**
   * Indie perfume house
   */
  indieHouse: (): ReturnType<typeof createMockHouse> => createMockHouse({
      type: "indie",
      country: faker.helpers.arrayElement(["USA", "UK", "Canada"]),
      founded: faker.date.past({ years: 10 }).getFullYear().toString(),
    }),

  /**
   * Celebrity perfume house
   */
  celebrityHouse: (): ReturnType<typeof createMockHouse> => createMockHouse({
      type: "celebrity",
      name: `${faker.person.firstName()} ${faker.person.lastName()} Fragrances`,
    }),

  /**
   * Minimal house with only required fields
   */
  minimalHouse: (): ReturnType<typeof createMockHouse> => createMockHouse({
      description: null,
      image: null,
      website: null,
      country: null,
      founded: null,
      email: null,
      phone: null,
      address: null,
    }),

  /**
   * Historic perfume house
   */
  historicHouse: (): ReturnType<typeof createMockHouse> => createMockHouse({
      founded: faker.date.past({ years: 200 }).getFullYear().toString(),
      country: "France",
      type: "designer",
    }),

  /**
   * House with special characters in name (edge case)
   */
  specialCharHouse: (): ReturnType<typeof createMockHouse> => createMockHouse({
      name: "L'Artisan Parfumeur & Co.",
      slug: "lartisan-parfumeur-and-co",
    }),

  /**
   * House with very long description (edge case)
   */
  longDescriptionHouse: (): ReturnType<typeof createMockHouse> => createMockHouse({
      description: faker.lorem.paragraphs(10),
    }),
}

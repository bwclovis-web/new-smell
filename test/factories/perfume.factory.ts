/**
 * Perfume Test Data Factory
 * Generates realistic perfume data for testing using @faker-js/faker
 */

import { faker } from "@faker-js/faker"

import type { Perfume } from "~/types/database"

import { createMockHouse, type CreateMockHouseOptions } from "./house.factory"

/**
 * Options for creating a mock perfume
 */
export interface CreateMockPerfumeOptions {
  id?: string
  name?: string
  slug?: string
  description?: string | null
  image?: string | null
  perfumeHouseId?: string | null
  createdAt?: Date
  updatedAt?: Date
  perfumeHouse?: ReturnType<typeof createMockHouse> | null
}

/**
 * Common perfume note categories for realistic data
 */
const PERFUME_NOTES = {
  floral: [
    "Rose",
    "Jasmine",
    "Lily",
    "Iris",
    "Violet",
    "Tuberose",
    "Ylang-Ylang",
    "Orange Blossom",
    "Gardenia",
    "Peony",
  ],
  citrus: [
    "Bergamot",
    "Lemon",
    "Orange",
    "Grapefruit",
    "Mandarin",
    "Lime",
    "Yuzu",
    "Neroli",
  ],
  woody: [
    "Sandalwood",
    "Cedar",
    "Oud",
    "Patchouli",
    "Vetiver",
    "Guaiac Wood",
    "Cypriol",
    "Agarwood",
  ],
  oriental: [
    "Vanilla",
    "Amber",
    "Tonka Bean",
    "Musk",
    "Incense",
    "Myrrh",
    "Benzoin",
    "Labdanum",
  ],
  fresh: [
    "Sea Notes",
    "Ozonic Notes",
    "Green Notes",
    "Aquatic Notes",
    "Mint",
    "Eucalyptus",
  ],
  spicy: [
    "Cinnamon",
    "Cardamom",
    "Black Pepper",
    "Pink Pepper",
    "Ginger",
    "Clove",
    "Nutmeg",
  ],
  gourmand: [
    "Chocolate",
    "Caramel",
    "Coffee",
    "Honey",
    "Almond",
    "Coconut",
    "Praline",
  ],
}

/**
 * Generates a realistic perfume name
 */
function generatePerfumeName(): string {
  const patterns = [
    () => `${faker.word.adjective()} ${faker.word.noun()}`,
    () => `${faker.person.lastName()} No. ${faker.number.int({
        min: 1,
        max: 100,
      })}`,
    () => faker.word.adjective(),
    () => `${faker.location.city()} ${faker.word.noun()}`,
    () => `${faker.color.human()} ${faker.helpers.arrayElement(Object.values(PERFUME_NOTES).flat())}`,
  ]

  const pattern = faker.helpers.arrayElement(patterns)
  return pattern()
}

/**
 * Generates a realistic perfume description with notes
 */
function generatePerfumeDescription(): string {
  const topNotes = faker.helpers.arrayElements(
    [...PERFUME_NOTES.citrus, ...PERFUME_NOTES.fresh],
    { min: 2, max: 3 }
  )
  const heartNotes = faker.helpers.arrayElements(
    [...PERFUME_NOTES.floral, ...PERFUME_NOTES.spicy],
    { min: 2, max: 4 }
  )
  const baseNotes = faker.helpers.arrayElements(
    [...PERFUME_NOTES.woody, ...PERFUME_NOTES.oriental],
    { min: 2, max: 3 }
  )

  return `${faker.commerce.productDescription()}

Top Notes: ${topNotes.join(", ")}
Heart Notes: ${heartNotes.join(", ")}
Base Notes: ${baseNotes.join(", ")}`
}

/**
 * Creates a mock Perfume with realistic data
 * @param overrides - Optional field overrides
 * @returns Mock Perfume object
 */
export function createMockPerfume(overrides: CreateMockPerfumeOptions = {}): Omit<
  Perfume,
  | "perfumeNotesClose"
  | "perfumeNotesHeart"
  | "perfumeNotesOpen"
  | "userPerfume"
  | "userPerfumeComments"
  | "userPerfumeRating"
  | "userPerfumeReview"
  | "userPerfumeWishlist"
  | "wishlistNotifications"
  | "userAlerts"
> {
  const name = overrides.name ?? generatePerfumeName()
  const slug = overrides.slug ?? faker.helpers.slugify(name).toLowerCase()

  // Create a perfume house if not provided and perfumeHouseId is not null
  let perfumeHouse = overrides.perfumeHouse
  let perfumeHouseId = overrides.perfumeHouseId

  if (perfumeHouseId === undefined && !perfumeHouse) {
    // Default behavior: create a perfume house
    perfumeHouse = createMockHouse()
    perfumeHouseId = perfumeHouse.id
  } else if (
    perfumeHouseId !== undefined &&
    perfumeHouseId !== null &&
    !perfumeHouse
  ) {
    // If perfumeHouseId is provided but no house object, create minimal house object
    perfumeHouse = createMockHouse({ id: perfumeHouseId })
  }

  return {
    id: overrides.id ?? faker.string.uuid(),
    name,
    slug,
    description:
      overrides.description !== undefined
        ? overrides.description
        : generatePerfumeDescription(),
    image:
      overrides.image !== undefined
        ? overrides.image
        : faker.image.url({ width: 600, height: 800 }),
    perfumeHouseId: perfumeHouseId ?? null,
    createdAt: overrides.createdAt ?? faker.date.past({ years: 2 }),
    updatedAt: overrides.updatedAt ?? faker.date.recent({ days: 30 }),
    perfumeHouse: perfumeHouse ?? null,
  }
}

/**
 * Creates multiple mock perfumes
 * @param count - Number of perfumes to create
 * @param overrides - Optional field overrides for all perfumes
 * @returns Array of mock Perfume objects
 */
export function createMockPerfumes(
  count: number,
  overrides: CreateMockPerfumeOptions = {}
): Array<ReturnType<typeof createMockPerfume>> {
  return Array.from({ length: count }, (_, i) => createMockPerfume({
      ...overrides,
      id: overrides.id ?? `perfume-${i + 1}`,
    }))
}

/**
 * Creates mock perfumes for a specific house
 * @param houseId - Perfume house ID
 * @param count - Number of perfumes to create
 * @param overrides - Optional field overrides for all perfumes
 * @returns Array of mock Perfume objects
 */
export function createMockPerfumesForHouse(
  houseId: string,
  count: number,
  overrides: Omit<CreateMockPerfumeOptions, "perfumeHouseId"> = {}
): Array<ReturnType<typeof createMockPerfume>> {
  const house = createMockHouse({ id: houseId })
  return Array.from({ length: count }, (_, i) => createMockPerfume({
      ...overrides,
      perfumeHouseId: houseId,
      perfumeHouse: house,
      id: overrides.id ?? `perfume-${i + 1}`,
    }))
}

/**
 * Creates a mock perfume with specific test scenarios
 */
export const perfumeFactoryPresets = {

  /**
   * Classic designer perfume
   */
  classicPerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      name: `${faker.person.lastName()} No. ${faker.number.int({
        min: 1,
        max: 100,
      })}`,
      createdAt: faker.date.past({ years: 50 }),
      perfumeHouse: createMockHouse({ type: "designer" }),
    }),

  /**
   * Modern niche perfume
   */
  nichePerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      perfumeHouse: createMockHouse({ type: "niche" }),
    }),

  /**
   * Indie perfume
   */
  indiePerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      perfumeHouse: createMockHouse({ type: "indie" }),
    }),

  /**
   * Perfume without a house (orphaned)
   */
  orphanedPerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      perfumeHouseId: null,
      perfumeHouse: null,
    }),

  /**
   * Minimal perfume with only required fields
   */
  minimalPerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      description: null,
      image: null,
      perfumeHouseId: null,
      perfumeHouse: null,
    }),

  /**
   * Recently added perfume
   */
  recentPerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      createdAt: faker.date.recent({ days: 1 }),
      updatedAt: faker.date.recent({ days: 1 }),
    }),

  /**
   * Perfume with special characters in name (edge case)
   */
  specialCharPerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      name: "L'Eau d'Issey & Rose",
      slug: "leau-dissey-and-rose",
    }),

  /**
   * Perfume with very long description (edge case)
   */
  longDescriptionPerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      description: faker.lorem.paragraphs(15),
    }),

  /**
   * Perfume with no image
   */
  noImagePerfume: (): ReturnType<typeof createMockPerfume> => createMockPerfume({
      image: null,
    }),
}

/**
 * Related Entities Test Data Factory
 * Generates realistic data for perfume-related entities (ratings, reviews, wishlist, etc.)
 */

import { faker } from "@faker-js/faker"
import type { PerfumeType, TradePreference } from "@prisma/client"

import type {
  UserPerfume,
  UserPerfumeComment,
  UserPerfumeRating,
  UserPerfumeReview,
  UserPerfumeWishlist,
} from "~/types/database"

import { createMockPerfume } from "./perfume.factory"
import { createMockUser } from "./user.factory"

/**
 * Creates a mock UserPerfume (perfume in user's collection)
 */
export interface CreateMockUserPerfumeOptions {
  id?: string
  userId?: string
  perfumeId?: string
  amount?: string
  available?: string
  price?: string | null
  placeOfPurchase?: string | null
  tradePrice?: string | null
  tradePreference?: TradePreference
  tradeOnly?: boolean
  createdAt?: Date
  type?: PerfumeType
}

export function createMockUserPerfume(overrides: CreateMockUserPerfumeOptions = {}): Omit<UserPerfume, "user" | "perfume" | "comments"> {
  return {
    id: overrides.id ?? faker.string.uuid(),
    userId: overrides.userId ?? faker.string.uuid(),
    perfumeId: overrides.perfumeId ?? faker.string.uuid(),
    amount: overrides.amount ?? faker.number.int({ min: 1, max: 100 }).toString(),
    available:
      overrides.available ?? faker.number.int({ min: 0, max: 50 }).toString(),
    price:
      overrides.price !== undefined
        ? overrides.price
        : faker.commerce.price({ min: 50, max: 500 }),
    placeOfPurchase:
      overrides.placeOfPurchase !== undefined
        ? overrides.placeOfPurchase
        : faker.company.name(),
    tradePrice:
      overrides.tradePrice !== undefined
        ? overrides.tradePrice
        : faker.commerce.price({ min: 40, max: 400 }),
    tradePreference:
      overrides.tradePreference ??
      faker.helpers.arrayElement<TradePreference>(["cash", "trade", "both"]),
    tradeOnly: overrides.tradeOnly ?? faker.datatype.boolean(),
    createdAt: overrides.createdAt ?? faker.date.past({ years: 1 }),
    type:
      overrides.type ??
      faker.helpers.arrayElement<PerfumeType>([
        "eauDeParfum",
        "eauDeToilette",
        "eauDeCologne",
        "parfum",
        "extraitDeParfum",
        "extraitOil",
        "oil",
        "waterMist",
        "ipmSpray",
      ]),
  }
}

/**
 * Creates a mock UserPerfumeRating
 */
export interface CreateMockRatingOptions {
  id?: string
  userId?: string
  perfumeId?: string
  gender?: number | null
  longevity?: number | null
  overall?: number | null
  priceValue?: number | null
  sillage?: number | null
  createdAt?: Date
  updatedAt?: Date
}

export function createMockRating(overrides: CreateMockRatingOptions = {}): Omit<UserPerfumeRating, "user" | "perfume"> {
  return {
    id: overrides.id ?? faker.string.uuid(),
    userId: overrides.userId ?? faker.string.uuid(),
    perfumeId: overrides.perfumeId ?? faker.string.uuid(),
    gender:
      overrides.gender !== undefined
        ? overrides.gender
        : faker.number.int({ min: 1, max: 5 }),
    longevity:
      overrides.longevity !== undefined
        ? overrides.longevity
        : faker.number.int({ min: 1, max: 5 }),
    overall:
      overrides.overall !== undefined
        ? overrides.overall
        : faker.number.int({ min: 1, max: 5 }),
    priceValue:
      overrides.priceValue !== undefined
        ? overrides.priceValue
        : faker.number.int({ min: 1, max: 5 }),
    sillage:
      overrides.sillage !== undefined
        ? overrides.sillage
        : faker.number.int({ min: 1, max: 5 }),
    createdAt: overrides.createdAt ?? faker.date.past({ years: 1 }),
    updatedAt: overrides.updatedAt ?? faker.date.recent({ days: 30 }),
  }
}

/**
 * Creates a mock UserPerfumeReview
 */
export interface CreateMockReviewOptions {
  id?: string
  userId?: string
  perfumeId?: string
  review?: string
  createdAt?: Date
}

export function createMockReview(overrides: CreateMockReviewOptions = {}): Omit<UserPerfumeReview, "user" | "perfume"> {
  return {
    id: overrides.id ?? faker.string.uuid(),
    userId: overrides.userId ?? faker.string.uuid(),
    perfumeId: overrides.perfumeId ?? faker.string.uuid(),
    review: overrides.review ?? faker.lorem.paragraphs(2),
    createdAt: overrides.createdAt ?? faker.date.past({ years: 1 }),
  }
}

/**
 * Creates a mock UserPerfumeWishlist entry
 */
export interface CreateMockWishlistOptions {
  id?: string
  userId?: string
  perfumeId?: string
  createdAt?: Date
}

export function createMockWishlistItem(overrides: CreateMockWishlistOptions = {}): Omit<UserPerfumeWishlist, "user" | "perfume"> {
  return {
    id: overrides.id ?? faker.string.uuid(),
    userId: overrides.userId ?? faker.string.uuid(),
    perfumeId: overrides.perfumeId ?? faker.string.uuid(),
    createdAt: overrides.createdAt ?? faker.date.past({ years: 1 }),
  }
}

/**
 * Creates a mock UserPerfumeComment
 */
export interface CreateMockCommentOptions {
  id?: string
  userId?: string
  perfumeId?: string
  userPerfumeId?: string
  comment?: string
  isPublic?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export function createMockComment(overrides: CreateMockCommentOptions = {}): Omit<UserPerfumeComment, "user" | "perfume" | "userPerfume"> {
  return {
    id: overrides.id ?? faker.string.uuid(),
    userId: overrides.userId ?? faker.string.uuid(),
    perfumeId: overrides.perfumeId ?? faker.string.uuid(),
    userPerfumeId: overrides.userPerfumeId ?? faker.string.uuid(),
    comment: overrides.comment ?? faker.lorem.paragraph(),
    isPublic: overrides.isPublic ?? faker.datatype.boolean(),
    createdAt: overrides.createdAt ?? faker.date.past({ years: 1 }),
    updatedAt: overrides.updatedAt ?? faker.date.recent({ days: 30 }),
  }
}

/**
 * Create complete test data sets with related entities
 */
export const relatedEntitiesPresets = {

  /**
   * Creates a complete user collection item with rating and review
   */
  completeUserPerfume: () => {
    const user = createMockUser()
    const perfume = createMockPerfume()

    return {
      userPerfume: createMockUserPerfume({
        userId: user.id,
        perfumeId: perfume.id,
      }),
      rating: createMockRating({
        userId: user.id,
        perfumeId: perfume.id,
      }),
      review: createMockReview({
        userId: user.id,
        perfumeId: perfume.id,
      }),
      user,
      perfume,
    }
  },

  /**
   * Creates a wishlist item with perfume details
   */
  completeWishlistItem: () => {
    const user = createMockUser()
    const perfume = createMockPerfume()

    return {
      wishlistItem: createMockWishlistItem({
        userId: user.id,
        perfumeId: perfume.id,
      }),
      user,
      perfume,
    }
  },

  /**
   * Creates multiple ratings for a perfume
   */
  perfumeRatings: (count: number = 5) => {
    const perfume = createMockPerfume()
    const ratings = Array.from({ length: count }, () => {
      const user = createMockUser()
      return {
        rating: createMockRating({
          userId: user.id,
          perfumeId: perfume.id,
        }),
        user,
      }
    })

    return {
      perfume,
      ratings,
    }
  },

  /**
   * Creates multiple reviews for a perfume
   */
  perfumeReviews: (count: number = 3) => {
    const perfume = createMockPerfume()
    const reviews = Array.from({ length: count }, () => {
      const user = createMockUser()
      return {
        review: createMockReview({
          userId: user.id,
          perfumeId: perfume.id,
        }),
        user,
      }
    })

    return {
      perfume,
      reviews,
    }
  },

  /**
   * Creates a user's complete perfume collection
   */
  userCollection: (perfumeCount: number = 10) => {
    const user = createMockUser()
    const collection = Array.from({ length: perfumeCount }, () => {
      const perfume = createMockPerfume()
      return {
        userPerfume: createMockUserPerfume({
          userId: user.id,
          perfumeId: perfume.id,
        }),
        perfume,
      }
    })

    return {
      user,
      collection,
    }
  },

  /**
   * Creates a perfume with complete data (ratings, reviews, comments)
   */
  completePerfumeData: () => {
    const perfume = createMockPerfume()
    const users = Array.from({ length: 5 }, () => createMockUser())

    return {
      perfume,
      ratings: users.map(user => createMockRating({
          userId: user.id,
          perfumeId: perfume.id,
        })),
      reviews: users.slice(0, 3).map(user => createMockReview({
          userId: user.id,
          perfumeId: perfume.id,
        })),
      users,
    }
  },
}

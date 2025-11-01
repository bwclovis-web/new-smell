/**
 * Bulk Data Factory
 * Utilities for generating large datasets efficiently for testing
 */

import { createMockHouse } from "./house.factory"
import { createMockPerfume, createMockPerfumesForHouse } from "./perfume.factory"
import {
  createMockRating,
  createMockReview,
  createMockUserPerfume,
  createMockWishlistItem,
} from "./related-entities.factory"
import { createMockUser } from "./user.factory"

/**
 * Generates a complete test database with realistic relationships
 */
export interface BulkDataConfig {
  users?: number
  houses?: number
  perfumesPerHouse?: number
  ratingsPerPerfume?: number
  reviewsPerPerfume?: number
}

export function generateBulkTestData(config: BulkDataConfig = {}) {
  const {
    users: userCount = 10,
    houses: houseCount = 5,
    perfumesPerHouse = 10,
    ratingsPerPerfume = 5,
    reviewsPerPerfume = 3,
  } = config

  // Generate users
  const users = Array.from({ length: userCount }, (_, i) =>
    createMockUser({ id: `user-${i + 1}` })
  )

  // Generate houses
  const houses = Array.from({ length: houseCount }, (_, i) =>
    createMockHouse({ id: `house-${i + 1}` })
  )

  // Generate perfumes for each house
  const perfumes = houses.flatMap((house, houseIndex) =>
    createMockPerfumesForHouse(house.id, perfumesPerHouse).map(
      (perfume, perfumeIndex) => ({
        ...perfume,
        id: `perfume-${houseIndex * perfumesPerHouse + perfumeIndex + 1}`,
      })
    )
  )

  // Generate ratings for each perfume
  const ratings = perfumes.flatMap((perfume, perfumeIndex) =>
    Array.from({ length: ratingsPerPerfume }, (_, ratingIndex) => {
      const user = users[ratingIndex % users.length]
      return createMockRating({
        id: `rating-${perfumeIndex * ratingsPerPerfume + ratingIndex + 1}`,
        userId: user!.id,
        perfumeId: perfume.id,
      })
    })
  )

  // Generate reviews for each perfume
  const reviews = perfumes.flatMap((perfume, perfumeIndex) =>
    Array.from({ length: reviewsPerPerfume }, (_, reviewIndex) => {
      const user = users[reviewIndex % users.length]
      return createMockReview({
        id: `review-${perfumeIndex * reviewsPerPerfume + reviewIndex + 1}`,
        userId: user!.id,
        perfumeId: perfume.id,
      })
    })
  )

  // Generate some user collections (subset of users)
  const userCollections = users
    .slice(0, Math.ceil(userCount / 2))
    .map((user, userIndex) => {
      const userPerfumes = perfumes
        .slice(userIndex * 3, userIndex * 3 + 5)
        .map((perfume, perfumeIndex) =>
          createMockUserPerfume({
            id: `user-perfume-${userIndex * 5 + perfumeIndex + 1}`,
            userId: user.id,
            perfumeId: perfume.id,
          })
        )

      return {
        user,
        perfumes: userPerfumes,
      }
    })

  // Generate wishlist items
  const wishlistItems = users.flatMap((user, userIndex) =>
    perfumes.slice(userIndex * 2, userIndex * 2 + 3).map((perfume, perfumeIndex) =>
      createMockWishlistItem({
        id: `wishlist-${userIndex * 3 + perfumeIndex + 1}`,
        userId: user.id,
        perfumeId: perfume.id,
      })
    )
  )

  return {
    users,
    houses,
    perfumes,
    ratings,
    reviews,
    userCollections,
    wishlistItems,
    stats: {
      totalUsers: users.length,
      totalHouses: houses.length,
      totalPerfumes: perfumes.length,
      totalRatings: ratings.length,
      totalReviews: reviews.length,
      totalUserCollectionItems: userCollections.reduce(
        (sum, c) => sum + c.perfumes.length,
        0
      ),
      totalWishlistItems: wishlistItems.length,
    },
  }
}

/**
 * Generates a large dataset for performance testing
 */
export function generateLargeDataset() {
  return generateBulkTestData({
    users: 100,
    houses: 20,
    perfumesPerHouse: 50,
    ratingsPerPerfume: 10,
    reviewsPerPerfume: 5,
  })
}

/**
 * Generates a small dataset for quick tests
 */
export function generateSmallDataset() {
  return generateBulkTestData({
    users: 3,
    houses: 2,
    perfumesPerHouse: 5,
    ratingsPerPerfume: 2,
    reviewsPerPerfume: 1,
  })
}

/**
 * Generates a medium dataset for integration tests
 */
export function generateMediumDataset() {
  return generateBulkTestData({
    users: 20,
    houses: 5,
    perfumesPerHouse: 20,
    ratingsPerPerfume: 5,
    reviewsPerPerfume: 3,
  })
}

/**
 * Batch data generation utilities
 */
export const batchGeneration = {
  /**
   * Creates a batch of users with sequential IDs
   */
  users: (count: number, prefix = "user") =>
    Array.from({ length: count }, (_, i) =>
      createMockUser({ id: `${prefix}-${i + 1}` })
    ),

  /**
   * Creates a batch of houses with sequential IDs
   */
  houses: (count: number, prefix = "house") =>
    Array.from({ length: count }, (_, i) =>
      createMockHouse({ id: `${prefix}-${i + 1}` })
    ),

  /**
   * Creates a batch of perfumes with sequential IDs
   */
  perfumes: (count: number, prefix = "perfume") =>
    Array.from({ length: count }, (_, i) =>
      createMockPerfume({ id: `${prefix}-${i + 1}` })
    ),

  /**
   * Creates a batch of ratings with sequential IDs
   */
  ratings: (count: number, userId: string, perfumeId: string, prefix = "rating") =>
    Array.from({ length: count }, (_, i) =>
      createMockRating({
        id: `${prefix}-${i + 1}`,
        userId,
        perfumeId,
      })
    ),

  /**
   * Creates a batch of reviews with sequential IDs
   */
  reviews: (count: number, userId: string, perfumeId: string, prefix = "review") =>
    Array.from({ length: count }, (_, i) =>
      createMockReview({
        id: `${prefix}-${i + 1}`,
        userId,
        perfumeId,
      })
    ),
}

/**
 * Seed data presets for common testing scenarios
 */
export const seedDataPresets = {
  /**
   * Empty database (minimal data for testing edge cases)
   */
  empty: () => ({
    users: [],
    houses: [],
    perfumes: [],
    ratings: [],
    reviews: [],
  }),

  /**
   * Single user scenario
   */
  singleUser: () => {
    const user = createMockUser({ id: "user-1" })
    const house = createMockHouse({ id: "house-1" })
    const perfumes = createMockPerfumesForHouse(house.id, 3)

    return {
      users: [user],
      houses: [house],
      perfumes,
      ratings: perfumes.map((p, i) =>
        createMockRating({
          id: `rating-${i + 1}`,
          userId: user.id,
          perfumeId: p.id,
        })
      ),
      reviews: [],
    }
  },

  /**
   * Multi-user scenario with interactions
   */
  multiUser: () => generateSmallDataset(),

  /**
   * Admin and regular users scenario
   */
  adminAndUsers: () => {
    const admin = createMockUser({ id: "admin-1", role: "admin" })
    const users = batchGeneration.users(5, "user")

    return {
      users: [admin, ...users],
      houses: batchGeneration.houses(3),
      perfumes: batchGeneration.perfumes(10),
    }
  },
}

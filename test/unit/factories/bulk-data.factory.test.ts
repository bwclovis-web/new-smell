/**
 * Bulk Data Factory Tests
 * Tests for bulk data generation utilities
 */

import { describe, expect, it } from 'vitest'

import {
  batchGeneration,
  generateBulkTestData,
  generateLargeDataset,
  generateMediumDataset,
  generateSmallDataset,
  seedDataPresets,
} from '../../factories/bulk-data.factory'

describe('Bulk Data Factory', () => {
  describe('generateBulkTestData', () => {
    it('should generate data with default configuration', () => {
      const data = generateBulkTestData()

      expect(data.users).toHaveLength(10)
      expect(data.houses).toHaveLength(5)
      expect(data.perfumes.length).toBeGreaterThan(0)
      expect(data.ratings.length).toBeGreaterThan(0)
      expect(data.reviews.length).toBeGreaterThan(0)
      expect(data.stats).toBeDefined()
    })

    it('should generate data with custom configuration', () => {
      const data = generateBulkTestData({
        users: 5,
        houses: 2,
        perfumesPerHouse: 3,
        ratingsPerPerfume: 2,
        reviewsPerPerfume: 1,
      })

      expect(data.users).toHaveLength(5)
      expect(data.houses).toHaveLength(2)
      expect(data.perfumes).toHaveLength(6) // 2 houses * 3 perfumes
      expect(data.ratings).toHaveLength(12) // 6 perfumes * 2 ratings
      expect(data.reviews).toHaveLength(6) // 6 perfumes * 1 review
    })

    it('should generate valid stats', () => {
      const data = generateBulkTestData({
        users: 3,
        houses: 2,
        perfumesPerHouse: 2,
      })

      expect(data.stats.totalUsers).toBe(3)
      expect(data.stats.totalHouses).toBe(2)
      expect(data.stats.totalPerfumes).toBe(4)
      expect(data.stats.totalRatings).toBeGreaterThan(0)
      expect(data.stats.totalReviews).toBeGreaterThan(0)
    })

    it('should create relationships between entities', () => {
      const data = generateBulkTestData({
        users: 2,
        houses: 1,
        perfumesPerHouse: 2,
        ratingsPerPerfume: 1,
      })

      const rating = data.ratings[0]
      const ratingUser = data.users.find(u => u.id === rating!.userId)
      const ratingPerfume = data.perfumes.find(p => p.id === rating!.perfumeId)

      expect(ratingUser).toBeDefined()
      expect(ratingPerfume).toBeDefined()
    })

    it('should create user collections for subset of users', () => {
      const data = generateBulkTestData({
        users: 4,
        houses: 1,
        perfumesPerHouse: 10,
      })

      expect(data.userCollections.length).toBeLessThanOrEqual(data.users.length)
      expect(data.userCollections.length).toBeGreaterThan(0)
    })

    it('should create wishlist items', () => {
      const data = generateBulkTestData({
        users: 2,
        houses: 1,
        perfumesPerHouse: 5,
      })

      expect(data.wishlistItems.length).toBeGreaterThan(0)
      data.wishlistItems.forEach(item => {
        expect(item.userId).toBeTruthy()
        expect(item.perfumeId).toBeTruthy()
      })
    })
  })

  describe('generateLargeDataset', () => {
    it('should generate a large dataset', () => {
      const data = generateLargeDataset()

      expect(data.users.length).toBe(100)
      expect(data.houses.length).toBe(20)
      expect(data.perfumes.length).toBe(1000) // 20 houses * 50 perfumes
      expect(data.ratings.length).toBe(10000) // 1000 perfumes * 10 ratings
      expect(data.reviews.length).toBe(5000) // 1000 perfumes * 5 reviews
    })
  })

  describe('generateSmallDataset', () => {
    it('should generate a small dataset', () => {
      const data = generateSmallDataset()

      expect(data.users.length).toBe(3)
      expect(data.houses.length).toBe(2)
      expect(data.perfumes.length).toBe(10) // 2 houses * 5 perfumes
      expect(data.ratings.length).toBe(20) // 10 perfumes * 2 ratings
      expect(data.reviews.length).toBe(10) // 10 perfumes * 1 review
    })
  })

  describe('generateMediumDataset', () => {
    it('should generate a medium dataset', () => {
      const data = generateMediumDataset()

      expect(data.users.length).toBe(20)
      expect(data.houses.length).toBe(5)
      expect(data.perfumes.length).toBe(100) // 5 houses * 20 perfumes
      expect(data.ratings.length).toBe(500) // 100 perfumes * 5 ratings
      expect(data.reviews.length).toBe(300) // 100 perfumes * 3 reviews
    })
  })

  describe('batchGeneration', () => {
    it('should batch generate users with sequential IDs', () => {
      const users = batchGeneration.users(5, 'test-user')

      expect(users).toHaveLength(5)
      expect(users[0]!.id).toBe('test-user-1')
      expect(users[4]!.id).toBe('test-user-5')
    })

    it('should batch generate houses with sequential IDs', () => {
      const houses = batchGeneration.houses(3, 'test-house')

      expect(houses).toHaveLength(3)
      expect(houses[0]!.id).toBe('test-house-1')
      expect(houses[2]!.id).toBe('test-house-3')
    })

    it('should batch generate perfumes with sequential IDs', () => {
      const perfumes = batchGeneration.perfumes(4, 'test-perfume')

      expect(perfumes).toHaveLength(4)
      expect(perfumes[0]!.id).toBe('test-perfume-1')
      expect(perfumes[3]!.id).toBe('test-perfume-4')
    })

    it('should batch generate ratings with same user and perfume', () => {
      const ratings = batchGeneration.ratings(3, 'user-1', 'perfume-1', 'test-rating')

      expect(ratings).toHaveLength(3)
      ratings.forEach(rating => {
        expect(rating.userId).toBe('user-1')
        expect(rating.perfumeId).toBe('perfume-1')
      })
      expect(ratings[0]!.id).toBe('test-rating-1')
      expect(ratings[2]!.id).toBe('test-rating-3')
    })

    it('should batch generate reviews with same user and perfume', () => {
      const reviews = batchGeneration.reviews(2, 'user-1', 'perfume-1', 'test-review')

      expect(reviews).toHaveLength(2)
      reviews.forEach(review => {
        expect(review.userId).toBe('user-1')
        expect(review.perfumeId).toBe('perfume-1')
      })
      expect(reviews[0]!.id).toBe('test-review-1')
      expect(reviews[1]!.id).toBe('test-review-2')
    })
  })

  describe('seedDataPresets', () => {
    it('should create empty dataset', () => {
      const empty = seedDataPresets.empty()

      expect(empty.users).toHaveLength(0)
      expect(empty.houses).toHaveLength(0)
      expect(empty.perfumes).toHaveLength(0)
      expect(empty.ratings).toHaveLength(0)
      expect(empty.reviews).toHaveLength(0)
    })

    it('should create single user scenario', () => {
      const singleUser = seedDataPresets.singleUser()

      expect(singleUser.users).toHaveLength(1)
      expect(singleUser.houses).toHaveLength(1)
      expect(singleUser.perfumes).toHaveLength(3)
      expect(singleUser.ratings).toHaveLength(3)
      expect(singleUser.reviews).toHaveLength(0)

      // Verify user owns all ratings
      singleUser.ratings.forEach(rating => {
        expect(rating.userId).toBe(singleUser.users[0]!.id)
      })
    })

    it('should create multi-user scenario', () => {
      const multiUser = seedDataPresets.multiUser()

      expect(multiUser.users.length).toBeGreaterThan(1)
      expect(multiUser.houses.length).toBeGreaterThan(0)
      expect(multiUser.perfumes.length).toBeGreaterThan(0)
    })

    it('should create admin and users scenario', () => {
      const adminAndUsers = seedDataPresets.adminAndUsers()

      expect(adminAndUsers.users.length).toBe(6) // 1 admin + 5 users
      expect(adminAndUsers.users[0]!.role).toBe('admin')
      expect(adminAndUsers.users[0]!.id).toBe('admin-1')

      adminAndUsers.users.slice(1).forEach((user, index) => {
        expect(user.role).toBe('user')
        expect(user.id).toBe(`user-${index + 1}`)
      })

      expect(adminAndUsers.houses.length).toBe(3)
      expect(adminAndUsers.perfumes.length).toBe(10)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain referential integrity', () => {
      const data = generateBulkTestData({
        users: 3,
        houses: 2,
        perfumesPerHouse: 2,
        ratingsPerPerfume: 2,
        reviewsPerPerfume: 1,
      })

      // All ratings should reference existing users and perfumes
      data.ratings.forEach(rating => {
        const userExists = data.users.some(u => u.id === rating.userId)
        const perfumeExists = data.perfumes.some(p => p.id === rating.perfumeId)
        expect(userExists).toBe(true)
        expect(perfumeExists).toBe(true)
      })

      // All reviews should reference existing users and perfumes
      data.reviews.forEach(review => {
        const userExists = data.users.some(u => u.id === review.userId)
        const perfumeExists = data.perfumes.some(p => p.id === review.perfumeId)
        expect(userExists).toBe(true)
        expect(perfumeExists).toBe(true)
      })
    })

    it('should create perfumes linked to houses', () => {
      const data = generateBulkTestData({
        houses: 2,
        perfumesPerHouse: 3,
      })

      data.perfumes.forEach(perfume => {
        const houseExists = data.houses.some(h => h.id === perfume.perfumeHouseId)
        expect(houseExists).toBe(true)
      })
    })
  })
})


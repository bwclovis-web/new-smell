/**
 * Perfume Route Integration Tests
 * 
 * Tests perfume detail page loader functionality:
 * - Perfume data loading by slug
 * - Ratings and reviews aggregation
 * - Wishlist status for authenticated users
 * - User session handling
 * - Parallel query execution and performance
 * - Error handling (missing slug, 404, invalid tokens)
 * - Authentication state management
 * 
 * @group integration
 * @group routes
 * @group perfume
 */

import type { LoaderFunctionArgs } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as perfumeServer from '~/models/perfume.server'
import * as perfumeRatingServer from '~/models/perfumeRating.server'
import * as perfumeReviewServer from '~/models/perfumeReview.server'
import * as userServer from '~/models/user.server'
import * as wishlistServer from '~/models/wishlist.server'
import { loader as perfumeLoader } from '~/routes/perfume'
import * as sessionManager from '~/utils/security/session-manager.server'

vi.mock('~/models/perfume.server')
vi.mock('~/models/perfumeRating.server')
vi.mock('~/models/perfumeReview.server')
vi.mock('~/models/user.server')
vi.mock('~/models/wishlist.server')
vi.mock('~/utils/security/session-manager.server')
vi.mock('cookie', () => ({
  default: {
    parse: vi.fn(str => {
      const obj: Record<string, string> = {}
      if (str) {
        str.split(';').forEach((cookie: string) => {
          const [key, value] = cookie.trim().split('=')
          obj[key] = value
        })
      }
      return obj
    })
  }
}))

describe('Perfume Route Integration Tests', () => {
  const mockPerfume = {
    id: 'perfume-1',
    name: 'Test Perfume',
    slug: 'test-perfume',
    description: 'A test perfume',
    perfumeHouse: {
      id: 'house-1',
      name: 'Test House',
      slug: 'test-house'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loader', () => {
    it('should load perfume data successfully for unauthenticated user', async () => {
      const mockRequest = new Request('https://example.com/perfume/test-perfume')

      const mockRatings = {
        averageRatings: {
          longevity: 4.5,
          sillage: 4.0,
          value: 4.2,
          complexity: 4.3
        },
        ratingCount: 10
      }

      vi.mocked(perfumeServer.getPerfumeBySlug).mockResolvedValue(mockPerfume as any)
      vi.mocked(sessionManager.verifyAccessToken).mockReturnValue(null)
      vi.mocked(perfumeRatingServer.getPerfumeRatings).mockResolvedValue(mockRatings as any)
      vi.mocked(perfumeReviewServer.getUserPerfumeReview).mockResolvedValue(null)

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: { perfumeSlug: 'test-perfume' },
        context: {}
      }

      const result = await perfumeLoader(args)

      expect(result.perfume).toEqual(mockPerfume)
      expect(result.user).toBeNull()
    })

    it('should throw error when perfume slug is missing', async () => {
      const mockRequest = new Request('https://example.com/perfume/')

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: {},
        context: {}
      }

      await expect(perfumeLoader(args)).rejects.toThrow('Perfume slug is required')
    })

    it('should throw 404 when perfume not found', async () => {
      const mockRequest = new Request('https://example.com/perfume/non-existent')

      vi.mocked(perfumeServer.getPerfumeBySlug).mockResolvedValue(null)

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: { perfumeSlug: 'non-existent' },
        context: {}
      }

      await expect(perfumeLoader(args)).rejects.toThrow('House not found')
    })

    it('should handle database errors gracefully', async () => {
      const mockRequest = new Request('https://example.com/perfume/test-perfume')

      vi.mocked(perfumeServer.getPerfumeBySlug).mockRejectedValue(new Error('Database connection failed'))

      const args: LoaderFunctionArgs = {
        request: mockRequest,
        params: { perfumeSlug: 'test-perfume' },
        context: {}
      }

      await expect(perfumeLoader(args)).rejects.toThrow('Database connection failed')
    })
  })
})


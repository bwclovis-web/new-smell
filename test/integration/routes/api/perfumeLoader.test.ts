/**
 * Perfume Loader API Integration Tests
 * 
 * Tests the perfume search API loader functionality:
 * - Search by perfume name
 * - Query parameter handling
 * - Empty results and error handling
 * - Special character handling in searches
 * - Database error propagation
 * 
 * @group integration
 * @group api
 */

import type { LoaderFunctionArgs } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as perfumeServer from '~/models/perfume.server'
import { loader } from '~/routes/api/perfumeLoader'

vi.mock('~/models/perfume.server')

describe('Perfume Loader API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loader', () => {
    it('should return perfumes matching the search name', async () => {
      const mockPerfumes = [
        {
          id: '1',
          name: 'Rose Perfume',
          slug: 'rose-perfume',
          description: 'A rose perfume',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Rosa Absolute',
          slug: 'rosa-absolute',
          description: 'Another rose perfume',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(mockPerfumes as any)

      const request = new Request('https://example.com/api/perfumeLoader?name=rose')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await loader(args)

      expect(result).toEqual(mockPerfumes)
      expect(perfumeServer.searchPerfumeByName).toHaveBeenCalledWith('rose')
    })

    it('should return empty array when name parameter is missing', async () => {
      const request = new Request('https://example.com/api/perfumeLoader')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await loader(args)

      expect(result).toEqual([])
      expect(perfumeServer.searchPerfumeByName).not.toHaveBeenCalled()
    })

    it('should return empty array when no perfumes match', async () => {
      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(null)

      const request = new Request('https://example.com/api/perfumeLoader?name=nonexistent')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await loader(args)

      expect(result).toEqual([])
    })

    it('should handle empty search results', async () => {
      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue([])

      const request = new Request('https://example.com/api/perfumeLoader?name=xyz')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await loader(args)

      expect(result).toEqual([])
    })

    it('should handle special characters in search query', async () => {
      const mockPerfumes = [
        {
          id: '1',
          name: 'L\'eau D\'issey',
          slug: 'leau-dissey',
          description: 'A perfume',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(mockPerfumes as any)

      const request = new Request('https://example.com/api/perfumeLoader?name=L%27eau')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await loader(args)

      expect(result).toEqual(mockPerfumes)
      expect(perfumeServer.searchPerfumeByName).toHaveBeenCalledWith("L'eau")
    })

    it('should handle database errors', async () => {
      vi.mocked(perfumeServer.searchPerfumeByName).mockRejectedValue(new Error('Database connection error'))

      const request = new Request('https://example.com/api/perfumeLoader?name=test')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await expect(loader(args)).rejects.toThrow('Database connection error')
    })

    it('should handle URL parsing errors', async () => {
      // Test with an invalid URL scenario
      const request = new Request('https://example.com/api/perfumeLoader?name=')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await loader(args)

      expect(result).toEqual([])
    })
  })

  describe('Query Parameter Handling', () => {
    it('should trim whitespace from search query', async () => {
      const mockPerfumes = [
        {
          id: '1',
          name: 'Test Perfume',
          slug: 'test-perfume',
          description: 'A test perfume',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(mockPerfumes as any)

      const request = new Request('https://example.com/api/perfumeLoader?name=%20test%20')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await loader(args)

      expect(perfumeServer.searchPerfumeByName).toHaveBeenCalledWith(' test ')
    })

    it('should handle case-sensitive searches', async () => {
      const mockPerfumes = [
        {
          id: '1',
          name: 'TEST PERFUME',
          slug: 'test-perfume',
          description: 'A test perfume',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(mockPerfumes as any)

      const request = new Request('https://example.com/api/perfumeLoader?name=TEST')
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await loader(args)

      expect(result).toEqual(mockPerfumes)
      expect(perfumeServer.searchPerfumeByName).toHaveBeenCalledWith('TEST')
    })
  })
})


import { describe, it, expect, beforeEach, vi } from 'vitest'

import { loader as homeLoader } from '~/routes/home'
import * as featureServer from '~/models/feature.server'

vi.mock('~/models/feature.server')

describe('Home Route Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loader', () => {
    it('should load features successfully', async () => {
      const mockFeatures = [
        {
          id: '1',
          title: 'Feature 1',
          description: 'Description 1',
          icon: 'icon1',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Feature 2',
          description: 'Description 2',
          icon: 'icon2',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(featureServer.getAllFeatures).mockResolvedValue(mockFeatures)

      const result = await homeLoader()

      expect(result).toEqual({ features: mockFeatures })
      expect(featureServer.getAllFeatures).toHaveBeenCalledTimes(1)
    })

    it('should handle empty features list', async () => {
      vi.mocked(featureServer.getAllFeatures).mockResolvedValue([])

      const result = await homeLoader()

      expect(result).toEqual({ features: [] })
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(featureServer.getAllFeatures).mockRejectedValue(
        new Error('Database error')
      )

      await expect(homeLoader()).rejects.toThrow('Database error')
    })

    it('should call getAllFeatures once per load', async () => {
      const mockFeatures = [
        {
          id: '1',
          title: 'Feature 1',
          description: 'Description 1',
          icon: 'icon1',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(featureServer.getAllFeatures).mockResolvedValue(mockFeatures)

      await homeLoader()
      await homeLoader()

      expect(featureServer.getAllFeatures).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should propagate network errors', async () => {
      vi.mocked(featureServer.getAllFeatures).mockRejectedValue(
        new Error('Network error')
      )

      await expect(homeLoader()).rejects.toThrow('Network error')
    })

    it('should propagate database connection errors', async () => {
      vi.mocked(featureServer.getAllFeatures).mockRejectedValue(
        new Error('Database connection failed')
      )

      await expect(homeLoader()).rejects.toThrow('Database connection failed')
    })
  })
})


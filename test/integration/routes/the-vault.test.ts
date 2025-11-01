/**
 * The Vault Route Integration Tests
 * 
 * Tests the vault (perfume collection) route loader:
 * - Basic loader functionality
 * - Empty object return (client-side data fetching)
 * - Idempotent behavior
 * - Error-free execution
 * 
 * Note: The Vault uses client-side data fetching, so the loader
 * returns an empty object and doesn't perform server-side data loading.
 * 
 * @group integration
 * @group routes
 * @group vault
 */

import { describe, expect, it } from 'vitest'

import { loader as vaultLoader } from '~/routes/the-vault'

describe('The Vault Route Integration Tests', () => {
  describe('Loader', () => {
    it('should return empty object', async () => {
      const result = await vaultLoader()

      expect(result).toEqual({})
    })

    it('should be callable multiple times', async () => {
      const result1 = await vaultLoader()
      const result2 = await vaultLoader()

      expect(result1).toEqual(result2)
      expect(result1).toEqual({})
    })

    it('should not throw errors', async () => {
      await expect(vaultLoader()).resolves.not.toThrow()
    })
  })
})


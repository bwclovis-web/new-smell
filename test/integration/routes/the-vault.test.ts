import { describe, it, expect } from 'vitest'

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


/**
 * Test Data Factories
 * Central export point for all test data factories
 * 
 * Usage:
 * ```typescript
 * import { createMockUser, createMockPerfume, createMockHouse } from 'test/factories'
 * 
 * const user = createMockUser({ email: 'test@example.com' })
 * const perfume = createMockPerfume({ name: 'Test Perfume' })
 * const house = createMockHouse({ type: 'niche' })
 * ```
 */

// User factories
export {
  createMockUser,
  createMockSafeUser,
  createMockAdminUser,
  createMockEditorUser,
  createMockUsers,
  userFactoryPresets,
  type CreateMockUserOptions,
} from './user.factory'

// House factories
export {
  createMockHouse,
  createMockHouses,
  houseFactoryPresets,
  type CreateMockHouseOptions,
} from './house.factory'

// Perfume factories
export {
  createMockPerfume,
  createMockPerfumes,
  createMockPerfumesForHouse,
  perfumeFactoryPresets,
  type CreateMockPerfumeOptions,
} from './perfume.factory'

// Additional related entity factories
export * from './related-entities.factory'

// Bulk data generation utilities
export * from './bulk-data.factory'


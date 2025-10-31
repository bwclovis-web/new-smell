# Test Data Factories

Comprehensive test data generation utilities using [@faker-js/faker](https://github.com/faker-js/faker) for creating realistic, type-safe test data.

## Quick Start

```typescript
import { createMockUser, createMockPerfume, createMockHouse } from 'test/factories'

// Create a user with default values
const user = createMockUser()

// Create with overrides
const admin = createMockUser({ 
  email: 'admin@test.com',
  role: 'admin' 
})

// Create a perfume with a house
const perfume = createMockPerfume({
  name: 'Santal 33',
  perfumeHouse: createMockHouse({ type: 'niche' })
})
```

## Factory Modules

### User Factory (`user.factory.ts`)

Create realistic user data with various roles and scenarios.

**Functions:**
- `createMockUser(overrides?)` - Create a single user
- `createMockSafeUser(overrides?)` - Create user without password
- `createMockAdminUser(overrides?)` - Create admin user
- `createMockEditorUser(overrides?)` - Create editor user
- `createMockUsers(count, overrides?)` - Create multiple users

**Presets:**
- `userFactoryPresets.newUser()` - User who just signed up
- `userFactoryPresets.establishedUser()` - User with complete profile
- `userFactoryPresets.minimalUser()` - User with minimal information
- `userFactoryPresets.specialCharUser()` - User with special characters (edge case)
- `userFactoryPresets.longNameUser()` - User with very long names (edge case)

**Example:**
```typescript
import { createMockUser, userFactoryPresets } from 'test/factories'

// Basic user
const user = createMockUser()

// Admin user
const admin = createMockUser({ role: 'admin' })

// New user scenario
const newUser = userFactoryPresets.newUser()
```

### House Factory (`house.factory.ts`)

Create perfume house data with different types and characteristics.

**Functions:**
- `createMockHouse(overrides?)` - Create a single house
- `createMockHouses(count, overrides?)` - Create multiple houses

**Presets:**
- `houseFactoryPresets.nicheHouse()` - Luxury niche house
- `houseFactoryPresets.designerHouse()` - Designer house
- `houseFactoryPresets.indieHouse()` - Indie house
- `houseFactoryPresets.celebrityHouse()` - Celebrity house
- `houseFactoryPresets.minimalHouse()` - House with minimal data
- `houseFactoryPresets.historicHouse()` - Historic house (100+ years)

**Example:**
```typescript
import { createMockHouse, houseFactoryPresets } from 'test/factories'

// Basic house
const house = createMockHouse()

// Niche house in France
const niche = createMockHouse({
  type: 'niche',
  country: 'France'
})

// Use preset
const designer = houseFactoryPresets.designerHouse()
```

### Perfume Factory (`perfume.factory.ts`)

Create perfume data with realistic notes and relationships to houses.

**Functions:**
- `createMockPerfume(overrides?)` - Create a single perfume
- `createMockPerfumes(count, overrides?)` - Create multiple perfumes
- `createMockPerfumesForHouse(houseId, count, overrides?)` - Create perfumes for a specific house

**Presets:**
- `perfumeFactoryPresets.classicPerfume()` - Classic designer perfume
- `perfumeFactoryPresets.nichePerfume()` - Niche perfume
- `perfumeFactoryPresets.indiePerfume()` - Indie perfume
- `perfumeFactoryPresets.orphanedPerfume()` - Perfume without house
- `perfumeFactoryPresets.minimalPerfume()` - Perfume with minimal data
- `perfumeFactoryPresets.recentPerfume()` - Recently added perfume

**Example:**
```typescript
import { createMockPerfume, createMockPerfumesForHouse } from 'test/factories'

// Perfume with auto-generated house
const perfume = createMockPerfume()

// Perfume with specific house
const santal = createMockPerfume({
  name: 'Santal 33',
  perfumeHouseId: 'house-123'
})

// Multiple perfumes for one house
const perfumes = createMockPerfumesForHouse('house-123', 10)
```

### Related Entities Factory (`related-entities.factory.ts`)

Create ratings, reviews, wishlist items, and comments.

**Functions:**
- `createMockUserPerfume(overrides?)` - User's perfume collection item
- `createMockRating(overrides?)` - Perfume rating
- `createMockReview(overrides?)` - Perfume review
- `createMockWishlistItem(overrides?)` - Wishlist entry
- `createMockComment(overrides?)` - Perfume comment

**Presets:**
- `relatedEntitiesPresets.completeUserPerfume()` - Collection item with rating & review
- `relatedEntitiesPresets.completeWishlistItem()` - Wishlist with perfume details
- `relatedEntitiesPresets.perfumeRatings(count)` - Multiple ratings for a perfume
- `relatedEntitiesPresets.perfumeReviews(count)` - Multiple reviews for a perfume
- `relatedEntitiesPresets.userCollection(count)` - Complete user collection
- `relatedEntitiesPresets.completePerfumeData()` - Perfume with all related data

**Example:**
```typescript
import { createMockRating, relatedEntitiesPresets } from 'test/factories'

// Single rating
const rating = createMockRating({
  userId: 'user-1',
  perfumeId: 'perfume-1',
  overall: 5
})

// Complete perfume data
const { perfume, ratings, reviews, users } = relatedEntitiesPresets.completePerfumeData()
```

### Bulk Data Factory (`bulk-data.factory.ts`)

Generate large datasets efficiently for integration and performance testing.

**Functions:**
- `generateBulkTestData(config?)` - Generate custom dataset
- `generateSmallDataset()` - Small dataset (quick tests)
- `generateMediumDataset()` - Medium dataset (integration tests)
- `generateLargeDataset()` - Large dataset (performance tests)
- `batchGeneration.users(count, prefix?)` - Batch generate users
- `batchGeneration.houses(count, prefix?)` - Batch generate houses
- `batchGeneration.perfumes(count, prefix?)` - Batch generate perfumes
- `batchGeneration.ratings(count, userId, perfumeId, prefix?)` - Batch generate ratings
- `batchGeneration.reviews(count, userId, perfumeId, prefix?)` - Batch generate reviews

**Seed Data Presets:**
- `seedDataPresets.empty()` - Empty database
- `seedDataPresets.singleUser()` - Single user with perfumes
- `seedDataPresets.multiUser()` - Multiple users with interactions
- `seedDataPresets.adminAndUsers()` - Admin + regular users

**Example:**
```typescript
import { generateBulkTestData, batchGeneration, seedDataPresets } from 'test/factories'

// Custom bulk data
const data = generateBulkTestData({
  users: 50,
  houses: 10,
  perfumesPerHouse: 20,
  ratingsPerPerfume: 5,
  reviewsPerPerfume: 3
})

// Access generated data
console.log(data.stats)
// {
//   totalUsers: 50,
//   totalHouses: 10,
//   totalPerfumes: 200,
//   totalRatings: 1000,
//   totalReviews: 600
// }

// Batch generation with sequential IDs
const users = batchGeneration.users(100, 'test-user')
// Creates: test-user-1, test-user-2, ..., test-user-100

// Use seed presets
const singleUserData = seedDataPresets.singleUser()
```

## Common Patterns

### Test Setup with Single Entity

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockUser, createMockPerfume } from 'test/factories'

describe('PerfumeCard', () => {
  let user, perfume

  beforeEach(() => {
    user = createMockUser()
    perfume = createMockPerfume()
  })

  it('should display perfume name', () => {
    // test implementation
  })
})
```

### Test Setup with Bulk Data

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { generateSmallDataset } from 'test/factories'

describe('PerfumeList Integration', () => {
  let testData

  beforeAll(() => {
    testData = generateSmallDataset()
  })

  it('should filter perfumes by house', () => {
    const house = testData.houses[0]
    const housePerfumes = testData.perfumes.filter(
      p => p.perfumeHouseId === house.id
    )
    expect(housePerfumes.length).toBeGreaterThan(0)
  })
})
```

### Performance Testing

```typescript
import { describe, it } from 'vitest'
import { generateLargeDataset } from 'test/factories'

describe('Performance Tests', () => {
  it('should handle large dataset efficiently', () => {
    const startTime = performance.now()
    
    const data = generateLargeDataset()
    // data contains 100 users, 1000 perfumes, 10000 ratings
    
    // Your performance test logic
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(1000) // Should complete in < 1s
  })
})
```

### Edge Case Testing

```typescript
import { describe, it } from 'vitest'
import { 
  userFactoryPresets, 
  houseFactoryPresets,
  perfumeFactoryPresets 
} from 'test/factories'

describe('Edge Cases', () => {
  it('should handle users with special characters', () => {
    const user = userFactoryPresets.specialCharUser()
    expect(user.firstName).toContain("'")
  })

  it('should handle perfumes without houses', () => {
    const perfume = perfumeFactoryPresets.orphanedPerfume()
    expect(perfume.perfumeHouseId).toBeNull()
  })

  it('should handle long descriptions', () => {
    const house = houseFactoryPresets.longDescriptionHouse()
    expect(house.description!.length).toBeGreaterThan(500)
  })
})
```

## Type Safety

All factories are fully typed with TypeScript:

```typescript
import type { CreateMockUserOptions } from 'test/factories'

const userOptions: CreateMockUserOptions = {
  email: 'test@example.com',
  role: 'admin', // Type-checked: 'user' | 'admin' | 'editor'
}

const user = createMockUser(userOptions)
```

## Backward Compatibility

Legacy functions from `test/utils/test-utils.tsx` still work but are deprecated:

```typescript
// ❌ Old way (deprecated)
import { createMockUser } from 'test/utils/test-utils'

// ✅ New way (recommended)
import { createMockUser } from 'test/factories'
```

## Testing the Factories

The factories themselves are thoroughly tested:

```bash
# Run factory tests
npm test -- test/unit/factories --run

# Results:
# - 88 tests passing
# - Coverage: user (21), house (22), perfume (25), bulk-data (20)
```

## Best Practices

1. **Use Presets for Common Scenarios**: Leverage presets like `nichePerfume()` or `newUser()` for standard test cases
2. **Override Only What You Need**: Start with defaults and override specific fields
3. **Use Bulk Generation for Performance Tests**: `generateLargeDataset()` for stress testing
4. **Maintain Referential Integrity**: Use `createMockPerfumesForHouse()` to ensure relationships
5. **Sequential IDs for Debugging**: Use `batchGeneration` with custom prefixes for easier debugging

## Contributing

When adding new entities:

1. Create a new factory file in `test/factories/`
2. Add comprehensive tests in `test/unit/factories/`
3. Export from `test/factories/index.ts`
4. Update this README with examples

## Related Files

- **Factories**: `test/factories/*.ts`
- **Tests**: `test/unit/factories/*.test.ts`
- **Test Utils**: `test/utils/test-utils.tsx` (legacy)
- **Documentation**: `docs/developer/CODE_QUALITY_IMPROVEMENTS.md`


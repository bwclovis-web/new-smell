# TanStack Query Implementation Checklist

## Overview
This document outlines the step-by-step process for implementing TanStack Query (React Query) v5 in your React Router v7 application. TanStack Query will replace manual client-side data fetching, caching, and state management with a robust, production-ready solution.

## Current State Analysis

### Existing Patterns to Replace:
1. **Custom hooks with manual caching**: `useHousesWithLocalCache`, `useDataByLetter`
2. **Direct fetch() calls**: Used throughout components (e.g., `perfume-house.tsx`, `perfume.tsx`)
3. **Manual localStorage caching**: Custom cache management in hooks
4. **Custom infinite scroll hooks**: `useInfiniteScroll`, `useInfiniteScrollHouses`
5. **Manual loading/error states**: useState for isLoading, error management

### Keep:
- **Server-side loaders**: React Router loaders for initial SSR data (e.g., `home.tsx`, `perfume-house.tsx`)
- **API routes**: Keep existing `/api/*` routes as data sources

## Implementation Phases

---

## Phase 1: Setup & Configuration ✅

### 1.1 Install Dependencies
- [ ] Move `@tanstack/react-query` from `devDependencies` to `dependencies` in `package.json`
- [ ] Verify version: Currently `^5.90.2` (keep or update to latest stable)
- [ ] Run `npm install` to ensure package is installed

### 1.2 Create Query Client Configuration
**File**: `app/lib/queryClient.ts`
- [ ] Create query client factory function
- [ ] Configure default options:
  - `staleTime`: 5 minutes (aligns with current cache duration)
  - `cacheTime`: 10 minutes
  - `retry`: 2-3 attempts
  - `refetchOnWindowFocus`: false (or true based on requirements)
  - `refetchOnReconnect`: true
- [ ] Export `queryClient` singleton

### 1.3 Setup QueryProvider
**File**: `app/providers/QueryProvider.tsx` (currently empty)
- [ ] Import `QueryClientProvider` from `@tanstack/react-query`
- [ ] Import query client from `app/lib/queryClient`
- [ ] Wrap children with `QueryClientProvider`
- [ ] Add React Query DevTools (development only)

### 1.4 Integrate Provider in Root
**File**: `app/root.tsx`
- [ ] Import `QueryProvider`
- [ ] Wrap `<Outlet />` with `QueryProvider` (inside existing providers)
- [ ] Ensure correct provider nesting order:
  ```
  NonceProvider
    I18nextProvider
      QueryProvider
        CSRFTokenProvider
          Outlet
  ```

---

## Phase 2: Query Functions & API Layer

### 2.1 Create Query Functions Directory
**Directory**: `app/lib/queries/`

### 2.2 API Query Functions

#### 2.2.1 Houses Queries
**File**: `app/lib/queries/houses.ts`
- [ ] `queryKeys.houses` - Query key factory
- [ ] `getHousesByLetter(letter, houseType)` - Query function
- [ ] `getHousesPaginated(filters)` - Query function
- [ ] `getHouseBySlug(slug)` - Query function
- [ ] `getHouseSort(filters)` - Query function (replaces `useHousesWithLocalCache`)

#### 2.2.2 Perfumes Queries
**File**: `app/lib/queries/perfumes.ts`
- [ ] `queryKeys.perfumes` - Query key factory
- [ ] `getPerfumesByLetter(letter, houseType)` - Query function
- [ ] `getPerfumeBySlug(slug)` - Query function
- [ ] `getMorePerfumes(houseSlug, pagination)` - Query function
- [ ] `getPerfumeSort(filters)` - Query function

#### 2.2.3 Reviews & Ratings Queries
**File**: `app/lib/queries/reviews.ts`
- [ ] `queryKeys.reviews` - Query key factory
- [ ] `getReviews(filters, pagination)` - Query function
- [ ] `getUserReviews(userId, filters)` - Query function
- [ ] `getRatings(perfumeId)` - Query function

#### 2.2.4 User Data Queries
**File**: `app/lib/queries/user.ts`
- [ ] `queryKeys.user` - Query key factory
- [ ] `getUserPerfumes(userId, filters)` - Query function
- [ ] `getWishlist(userId)` - Query function
- [ ] `getUserAlerts(userId)` - Query function

#### 2.2.5 Data Quality Queries
**File**: `app/lib/queries/dataQuality.ts`
- [ ] `queryKeys.dataQuality` - Query key factory
- [ ] `getDataQualityStats(timeframe, force?)` - Query function
- [ ] `getDataQualityHouses()` - Query function

#### 2.2.6 Tags Queries
**File**: `app/lib/queries/tags.ts`
- [ ] `queryKeys.tags` - Query key factory
- [ ] `getTag(name)` - Query function

### 2.3 Query Key Factories Pattern
- [ ] Use hierarchical query keys: `['resource', 'list']`, `['resource', 'detail', id]`
- [ ] Include filters in keys: `['houses', 'byLetter', letter, houseType]`
- [ ] Create reusable key factories in each query file

---

## Phase 3: Custom Hooks (useQuery)

### 3.1 Replace useHousesWithLocalCache
**File**: `app/hooks/useHouses.ts` (new)
- [ ] Create `useHouses(filters)` hook using `useQuery`
- [ ] Use `getHouseSort` query function
- [ ] Configure staleTime: 5 minutes
- [ ] Update all components using `useHousesWithLocalCache`
- [ ] **Files to update**:
  - Search for imports of `useHousesWithLocalCache`

### 3.2 Replace useDataByLetter
**File**: `app/hooks/useHousesByLetter.ts` (new)
**File**: `app/hooks/usePerfumesByLetter.ts` (new)
- [ ] Split into separate hooks for houses and perfumes
- [ ] Use `useQuery` with `getHousesByLetter` / `getPerfumesByLetter`
- [ ] Replace `useDataByLetter` usage throughout codebase
- [ ] **Files to update**:
  - `app/routes/behind-the-bottle.tsx`
  - `app/routes/the-vault.tsx`
  - Components using `useDataByLetter`

### 3.3 Infinite Scroll Hooks
**File**: `app/hooks/useInfiniteHouses.ts` (refactor)
**File**: `app/hooks/useInfinitePerfumes.ts` (refactor)
- [ ] Replace `useInfiniteScroll`, `useInfiniteScrollHouses`, `useInfiniteScrollPerfumes`
- [ ] Use `useInfiniteQuery` from TanStack Query
- [ ] Implement `getNextPageParam` for pagination
- [ ] Update infinite scroll UI components
- [ ] **Files to update**:
  - `app/routes/perfume-house.tsx` (uses `useInfiniteScroll`)
  - `app/hooks/useInfiniteScroll.ts`

### 3.4 Page-Specific Hooks

#### 3.4.1 Perfume House Page
**File**: `app/routes/perfume-house.tsx`
- [ ] Keep server loader for initial house data
- [ ] Create `useMorePerfumes(houseSlug, initialData)` hook
- [ ] Replace direct `fetch()` call with `useInfiniteQuery`
- [ ] Remove manual loading/error state management

#### 3.4.2 Perfume Page
**File**: `app/routes/perfume.tsx`
- [ ] Keep server loader for initial perfume data
- [ ] Create hooks for:
  - Reviews: `usePerfumeReviews(perfumeId)`
  - Ratings: `usePerfumeRatings(perfumeId)`
  - Wishlist status: `useWishlistStatus(perfumeId)`

#### 3.4.3 Data Quality Dashboard
**File**: `app/components/Containers/DataQualityDashboard/DataQualityDashboard.tsx`
- [ ] Replace manual fetch logic with `useQuery`
- [ ] Use `getDataQualityStats` query function
- [ ] Remove custom debouncing (TanStack Query handles this)
- [ ] Keep force refresh functionality using `refetch()`

---

## Phase 4: Mutations

### 4.1 Create Mutation Functions
**Directory**: `app/lib/mutations/`

#### 4.1.1 Wishlist Mutations
**File**: `app/lib/mutations/wishlist.ts`
- [ ] `useToggleWishlist()` - Optimistic update mutation
- [ ] Invalidate `['wishlist']` queries on success
- [ ] Invalidate `['perfumes', 'detail', id]` for updated perfume

#### 4.1.2 Review Mutations
**File**: `app/lib/mutations/reviews.ts`
- [ ] `useCreateReview()` - Create review mutation
- [ ] `useUpdateReview()` - Update review mutation
- [ ] `useDeleteReview()` - Delete review mutation
- [ ] Invalidate reviews queries on success

#### 4.1.3 Rating Mutations
**File**: `app/lib/mutations/ratings.ts`
- [ ] `useCreateRating()` - Create rating mutation
- [ ] `useUpdateRating()` - Update rating mutation
- [ ] Invalidate ratings and perfume queries on success

#### 4.1.4 House Mutations
**File**: `app/lib/mutations/houses.ts`
- [ ] `useDeleteHouse()` - Delete house mutation
- [ ] Invalidate houses queries on success
- [ ] Optimistic updates for better UX

#### 4.1.5 Perfume Mutations
**File**: `app/lib/mutations/perfumes.ts`
- [ ] `useDeletePerfume()` - Delete perfume mutation
- [ ] Invalidate perfumes queries on success

#### 4.1.6 Tag Mutations
**File**: `app/lib/mutations/tags.ts`
- [ ] `useCreateTag()` - Create tag mutation
- [ ] Invalidate tag queries on success

### 4.2 Update Components Using Mutations

#### 4.2.1 Wishlist Components
- [ ] `app/components/Containers/Perfume/PerfumeIcons/PerfumeIcons.tsx`
  - Replace direct `fetch('/api/wishlist')` with `useToggleWishlist()`

#### 4.2.2 Delete Actions
- [ ] `app/routes/perfume-house.tsx` - Use `useDeleteHouse()` mutation
- [ ] Update delete handlers to use mutations instead of direct fetch

---

## Phase 5: Integration with React Router Loaders

### 5.1 Hydration Strategy
- [ ] Use `useLoaderData` for initial SSR data
- [ ] Create "hydration" queries that use loader data as `initialData`
- [ ] Pattern:
  ```typescript
  const loaderData = useLoaderData<typeof loader>()
  const { data } = useQuery({
    ...queryOptions,
    initialData: loaderData,
    initialDataUpdatedAt: Date.now()
  })
  ```

### 5.2 Files to Update
- [ ] `app/routes/home.tsx` - Hydrate features query
- [ ] `app/routes/perfume-house.tsx` - Hydrate house query
- [ ] `app/routes/perfume.tsx` - Hydrate perfume query
- [ ] `app/routes/trader-profile.tsx` - Hydrate trader query

---

## Phase 6: Advanced Features

### 6.1 Prefetching
**Files**: `app/routes/behind-the-bottle.tsx`, `app/routes/the-vault.tsx`
- [ ] Prefetch data on hover for letter navigation
- [ ] Use `queryClient.prefetchQuery()` in event handlers
- [ ] Prefetch next page in infinite queries

### 6.2 Optimistic Updates
- [ ] Wishlist toggles: Update UI immediately
- [ ] Review submissions: Show pending state
- [ ] Rating submissions: Update average immediately

### 6.3 Cache Management
- [ ] Create utility functions for cache invalidation
- [ ] Clear cache on logout
- [ ] Selective cache clearing by resource type

### 6.4 Error Handling
- [ ] Create error boundary for query errors
- [ ] Consistent error UI components
- [ ] Retry logic configuration per query type

### 6.5 Background Refetching
- [ ] Configure `refetchInterval` for real-time data (if needed)
- [ ] Use `refetchOnWindowFocus` strategically
- [ ] Implement stale-while-revalidate pattern

---

## Phase 7: Migration & Cleanup

### 7.1 Remove Old Hooks
- [ ] Delete `app/hooks/useHousesWithLocalCache.ts` after migration
- [ ] Delete or refactor `app/hooks/useDataByLetter.ts`
- [ ] Update or remove custom infinite scroll hooks

### 7.2 Remove Manual Caching
- [ ] Remove localStorage cache logic from hooks
- [ ] Remove `clearLocalHouseCache` function
- [ ] Clean up cache-related utilities

### 7.3 Update Imports
- [ ] Find all files importing old hooks
- [ ] Update to use new TanStack Query hooks
- [ ] Run linter to catch unused imports

### 7.4 Testing
- [ ] Test query invalidation after mutations
- [ ] Test optimistic updates
- [ ] Test infinite scroll with new hooks
- [ ] Test error states and retries
- [ ] Test cache persistence on navigation

---

## Phase 8: Documentation & Best Practices

### 8.1 Create Documentation
**File**: `app/lib/queries/README.md`
- [ ] Document query key patterns
- [ ] Document mutation patterns
- [ ] Document hydration strategy
- [ ] Document cache invalidation patterns

### 8.2 Code Organization
- [ ] Ensure consistent file structure
- [ ] Add JSDoc comments to query functions
- [ ] Document hook usage with examples

---

## Implementation Priority

### High Priority (Do First)
1. ✅ Phase 1: Setup & Configuration
2. ✅ Phase 2: Query Functions & API Layer (core queries)
3. ✅ Phase 3: Custom Hooks (replace most used hooks first)
4. ✅ Phase 4: Mutations (wishlist, reviews - user-facing)

### Medium Priority
5. Phase 5: Integration with React Router Loaders
6. Phase 6: Advanced Features (prefetching, optimistic updates)
7. Phase 7: Migration & Cleanup

### Low Priority
8. Phase 8: Documentation & Best Practices

---

## File Reference Map

### Files to Create:
```
app/lib/
  queryClient.ts
  queries/
    houses.ts
    perfumes.ts
    reviews.ts
    user.ts
    dataQuality.ts
    tags.ts
  mutations/
    wishlist.ts
    reviews.ts
    ratings.ts
    houses.ts
    perfumes.ts
    tags.ts
```

### Files to Update:
- `app/providers/QueryProvider.tsx` (currently empty)
- `app/root.tsx` (add QueryProvider)
- `package.json` (move @tanstack/react-query to dependencies)
- `app/hooks/useHousesWithLocalCache.ts` (replace usage, then delete)
- `app/hooks/useDataByLetter.ts` (replace usage, then refactor/delete)
- `app/hooks/useInfiniteScroll.ts` (replace with useInfiniteQuery)
- `app/routes/perfume-house.tsx`
- `app/routes/perfume.tsx`
- `app/routes/behind-the-bottle.tsx`
- `app/routes/the-vault.tsx`
- `app/components/Containers/DataQualityDashboard/DataQualityDashboard.tsx`
- `app/components/Containers/Perfume/PerfumeIcons/PerfumeIcons.tsx`

---

## Key Patterns to Follow

### Query Key Pattern:
```typescript
export const queryKeys = {
  houses: {
    all: ['houses'] as const,
    lists: () => [...queryKeys.houses.all, 'list'] as const,
    list: (filters: HouseFilters) => [...queryKeys.houses.lists(), filters] as const,
    details: () => [...queryKeys.houses.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.houses.details(), slug] as const,
    byLetter: (letter: string, houseType: string) => [...queryKeys.houses.all, 'byLetter', letter, houseType] as const,
  }
}
```

### Query Function Pattern:
```typescript
export async function getHousesByLetter(letter: string, houseType: string) {
  const response = await fetch(`/api/houses-by-letter?letter=${letter}&houseType=${houseType}`)
  if (!response.ok) throw new Error('Failed to fetch houses')
  const data = await response.json()
  return data.houses || []
}
```

### Hook Pattern:
```typescript
export function useHousesByLetter(letter: string, houseType: string = 'all') {
  return useQuery({
    queryKey: queryKeys.houses.byLetter(letter, houseType),
    queryFn: () => getHousesByLetter(letter, houseType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!letter,
  })
}
```

### Mutation Pattern:
```typescript
export function useToggleWishlist() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (perfumeId: string) => {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfumeId }),
      })
      if (!response.ok) throw new Error('Failed to toggle wishlist')
      return response.json()
    },
    onSuccess: (data, perfumeId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['perfumes', 'detail', perfumeId] })
    },
    // Optimistic update
    onMutate: async (perfumeId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })
      const previousWishlist = queryClient.getQueryData(['wishlist'])
      // Update cache optimistically
      return { previousWishlist }
    },
    onError: (err, perfumeId, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist)
      }
    },
  })
}
```

---

## Testing Checklist

After implementation, verify:
- [ ] Queries load data correctly
- [ ] Cache persists between navigations
- [ ] Mutations update cache correctly
- [ ] Optimistic updates work and rollback on error
- [ ] Infinite queries load more data correctly
- [ ] Error states display properly
- [ ] Loading states display properly
- [ ] SSR hydration works correctly
- [ ] No console errors or warnings
- [ ] Performance is same or better than before

---

## Notes

- TanStack Query is already installed but in devDependencies - move to dependencies
- Current cache duration is 5 minutes - align with TanStack Query staleTime
- Keep React Router loaders for initial SSR - use hydration pattern
- Many API routes return JSON with `success` field - handle in query functions
- Some routes use pagination with `skip`/`take` - handle in infinite queries

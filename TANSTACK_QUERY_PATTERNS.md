# TanStack Query Implementation Patterns

Quick reference guide for implementing TanStack Query in this project.

## Setup Pattern

### 1. Query Client (`app/lib/queryClient.ts`)
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (matches current cache)
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

### 2. Query Provider (`app/providers/QueryProvider.tsx`)
```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '~/lib/queryClient'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
```

### 3. Root Integration (`app/root.tsx`)
```typescript
// ... existing imports ...
import { QueryProvider } from './providers/QueryProvider'

export default function App() {
  return (
    <NonceProvider value={undefined}>
      <I18nextProvider i18n={i18n}>
        <QueryProvider>
          <CSRFTokenProvider>
            <Outlet />
          </CSRFTokenProvider>
        </QueryProvider>
      </I18nextProvider>
    </NonceProvider>
  )
}
```

---

## Query Patterns

### Query Key Factory
```typescript
// app/lib/queries/houses.ts
export const queryKeys = {
  houses: {
    all: ['houses'] as const,
    lists: () => [...queryKeys.houses.all, 'list'] as const,
    list: (filters: { houseType: string; sortBy: string }) => 
      [...queryKeys.houses.lists(), filters] as const,
    details: () => [...queryKeys.houses.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.houses.details(), slug] as const,
    byLetter: (letter: string, houseType: string) => 
      [...queryKeys.houses.all, 'byLetter', letter, houseType] as const,
  },
}
```

### Query Function
```typescript
// app/lib/queries/houses.ts
export async function getHousesByLetter(letter: string, houseType: string = 'all') {
  const response = await fetch(
    `/api/houses-by-letter?letter=${letter}&houseType=${houseType}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch houses: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Handle API response format with 'success' field
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch houses')
  }
  
  return data.houses || []
}
```

### Custom Hook with useQuery
```typescript
// app/hooks/useHousesByLetter.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys, getHousesByLetter } from '~/lib/queries/houses'

export function useHousesByLetter(letter: string, houseType: string = 'all') {
  return useQuery({
    queryKey: queryKeys.houses.byLetter(letter, houseType),
    queryFn: () => getHousesByLetter(letter, houseType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!letter, // Only fetch if letter is provided
  })
}
```

### Usage in Component
```typescript
// Before (manual fetch):
const [data, setData] = useState([])
const [isLoading, setIsLoading] = useState(false)

useEffect(() => {
  setIsLoading(true)
  fetch(`/api/houses-by-letter?letter=${letter}`)
    .then(res => res.json())
    .then(data => setData(data.houses))
    .finally(() => setIsLoading(false))
}, [letter])

// After (TanStack Query):
const { data = [], isLoading, error } = useHousesByLetter(letter, houseType)
```

---

## Infinite Query Pattern

### Infinite Query Function
```typescript
// app/lib/queries/perfumes.ts
export async function getMorePerfumes({
  houseSlug,
  skip,
  take,
}: {
  houseSlug: string
  skip: number
  take: number
}) {
  const response = await fetch(
    `/api/more-perfumes?houseSlug=${houseSlug}&skip=${skip}&take=${take}`
  )
  
  if (!response.ok) throw new Error('Failed to fetch perfumes')
  
  const data = await response.json()
  return {
    perfumes: data.perfumes || [],
    hasMore: data.meta?.hasMore || false,
    skip: data.meta?.skip || skip,
    take: data.meta?.take || take,
  }
}
```

### Infinite Query Hook
```typescript
// app/hooks/useInfinitePerfumes.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys, getMorePerfumes } from '~/lib/queries/perfumes'

export function useInfinitePerfumes(
  houseSlug: string,
  initialPerfumes: any[] = []
) {
  return useInfiniteQuery({
    queryKey: queryKeys.perfumes.listByHouse(houseSlug),
    queryFn: ({ pageParam = { skip: 0, take: 9 } }) =>
      getMorePerfumes({ houseSlug, ...pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined
      return {
        skip: lastPage.skip + lastPage.take,
        take: lastPage.take,
      }
    },
    initialPageParam: { skip: initialPerfumes.length, take: 9 },
    initialData: initialPerfumes.length > 0 ? {
      pages: [{ perfumes: initialPerfumes, hasMore: true, skip: 0, take: 9 }],
      pageParams: [{ skip: 0, take: 9 }],
    } : undefined,
  })
}
```

### Usage in Component
```typescript
// app/routes/perfume-house.tsx
const { perfumeHouse } = useLoaderData<typeof loader>()
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfinitePerfumes(perfumeHouse.slug, perfumeHouse.perfumes || [])

// Flatten pages
const perfumes = data?.pages.flatMap(page => page.perfumes) || []

// Load more
<button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
  {isFetchingNextPage ? 'Loading...' : 'Load More'}
</button>
```

---

## Mutation Patterns

### Basic Mutation
```typescript
// app/lib/mutations/wishlist.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '~/lib/queries/wishlist'

export function useToggleWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (perfumeId: string) => {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfumeId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to toggle wishlist')
      }

      return response.json()
    },
    onSuccess: (data, perfumeId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ 
        queryKey: ['perfumes', 'detail', perfumeId] 
      })
    },
  })
}
```

### Mutation with Optimistic Update
```typescript
export function useToggleWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (perfumeId: string) => {
      // ... fetch logic ...
    },
    onMutate: async (perfumeId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })

      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData(['wishlist'])

      // Optimistically update
      queryClient.setQueryData(['wishlist'], (old: any) => {
        if (!old) return old
        const isInWishlist = old.some((p: any) => p.id === perfumeId)
        return isInWishlist
          ? old.filter((p: any) => p.id !== perfumeId)
          : [...old, { id: perfumeId }]
      })

      return { previousWishlist }
    },
    onError: (err, perfumeId, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
}
```

### Usage in Component
```typescript
// app/components/Containers/Perfume/PerfumeIcons/PerfumeIcons.tsx
const toggleWishlist = useToggleWishlist()

const handleWishlistToggle = () => {
  toggleWishlist.mutate(perfumeId, {
    onSuccess: () => {
      // Optional: Show toast notification
    },
    onError: (error) => {
      // Handle error
      console.error(error)
    },
  })
}

<button 
  onClick={handleWishlistToggle}
  disabled={toggleWishlist.isPending}
>
  {toggleWishlist.isPending ? 'Loading...' : 'Add to Wishlist'}
</button>
```

---

## React Router Integration Pattern

### Hydration from Loader Data
```typescript
// app/routes/perfume-house.tsx
export async function loader({ params }: LoaderFunctionArgs) {
  const perfumeHouse = await getPerfumeHouseBySlug(params.houseSlug, {
    skip: 0,
    take: 9,
  })
  return { perfumeHouse }
}

export default function PerfumeHousePage() {
  const loaderData = useLoaderData<typeof loader>()
  
  // Hydrate query with loader data
  const { data: perfumeHouse } = useQuery({
    queryKey: queryKeys.houses.detail(loaderData.perfumeHouse.slug),
    queryFn: () => getHouseBySlug(loaderData.perfumeHouse.slug),
    initialData: loaderData.perfumeHouse,
    initialDataUpdatedAt: Date.now(),
    staleTime: 5 * 60 * 1000,
  })

  // Use infinite query for perfumes
  const { data, fetchNextPage, hasNextPage } = useInfinitePerfumes(
    perfumeHouse.slug,
    perfumeHouse.perfumes || []
  )

  // ...
}
```

---

## Prefetching Pattern

### Prefetch on Hover/Link
```typescript
// app/routes/behind-the-bottle.tsx
import { queryClient } from '~/lib/queryClient'
import { queryKeys, getHousesByLetter } from '~/lib/queries/houses'

function LetterButton({ letter }: { letter: string }) {
  const handleMouseEnter = () => {
    // Prefetch on hover
    queryClient.prefetchQuery({
      queryKey: queryKeys.houses.byLetter(letter, 'all'),
      queryFn: () => getHousesByLetter(letter, 'all'),
      staleTime: 5 * 60 * 1000,
    })
  }

  return (
    <Link
      to={`/behind-the-bottle/${letter}`}
      onMouseEnter={handleMouseEnter}
    >
      {letter}
    </Link>
  )
}
```

---

## Error Handling Pattern

### Query with Error Handling
```typescript
export function useHousesByLetter(letter: string, houseType: string = 'all') {
  const query = useQuery({
    queryKey: queryKeys.houses.byLetter(letter, houseType),
    queryFn: () => getHousesByLetter(letter, houseType),
    staleTime: 5 * 60 * 1000,
    enabled: !!letter,
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 2
    },
  })

  return query
}
```

### Error UI Component
```typescript
const { data, isLoading, error } = useHousesByLetter(letter, houseType)

if (error) {
  return (
    <div className="error-message">
      <p>Error loading houses: {error.message}</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  )
}
```

---

## Cache Invalidation Pattern

### Utility Functions
```typescript
// app/lib/queries/utils.ts
import { queryClient } from './queryClient'

export function invalidateHouses() {
  queryClient.invalidateQueries({ queryKey: ['houses'] })
}

export function invalidatePerfumes() {
  queryClient.invalidateQueries({ queryKey: ['perfumes'] })
}

export function invalidateUserData() {
  queryClient.invalidateQueries({ queryKey: ['user'] })
  queryClient.invalidateQueries({ queryKey: ['wishlist'] })
}

// Use after logout
export function clearAllCache() {
  queryClient.clear()
}
```

---

## TypeScript Types

### Query Result Type
```typescript
// app/lib/queries/houses.ts
export type House = {
  id: string
  name: string
  slug: string
  // ... other fields
}

export type HousesResponse = {
  houses: House[]
  meta?: {
    totalCount: number
    hasMore: boolean
  }
}

export async function getHousesByLetter(
  letter: string,
  houseType: string = 'all'
): Promise<House[]> {
  // ... implementation
}
```

### Hook with Types
```typescript
export function useHousesByLetter(
  letter: string,
  houseType: string = 'all'
) {
  return useQuery<House[]>({
    queryKey: queryKeys.houses.byLetter(letter, houseType),
    queryFn: () => getHousesByLetter(letter, houseType),
    staleTime: 5 * 60 * 1000,
    enabled: !!letter,
  })
}
```

---

## Migration Examples

### Example 1: Replace useHousesWithLocalCache
```typescript
// Before: app/hooks/useHousesWithLocalCache.ts
export const useHousesWithLocalCache = (filters: HouseFilters = {}) => {
  const { houseType = "all", sortBy = "created-desc" } = filters
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  // ... manual caching logic ...
}

// After: app/hooks/useHouses.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys, getHouseSort } from '~/lib/queries/houses'

export function useHouses(filters: HouseFilters = {}) {
  const { houseType = 'all', sortBy = 'created-desc' } = filters
  
  return useQuery({
    queryKey: queryKeys.houses.list({ houseType, sortBy }),
    queryFn: () => getHouseSort({ houseType, sortBy }),
    staleTime: 5 * 60 * 1000,
  })
}
```

### Example 2: Replace useDataByLetter
```typescript
// Before: app/hooks/useDataByLetter.ts
const useDataByLetter = <T>({
  endpoint,
  itemName,
  houseType = "all",
}) => {
  // ... manual fetch logic ...
}

// After: Split into specific hooks
// app/hooks/useHousesByLetter.ts
export function useHousesByLetter(letter: string, houseType: string = 'all') {
  return useQuery({
    queryKey: queryKeys.houses.byLetter(letter, houseType),
    queryFn: () => getHousesByLetter(letter, houseType),
    staleTime: 5 * 60 * 1000,
    enabled: !!letter,
  })
}

// app/hooks/usePerfumesByLetter.ts
export function usePerfumesByLetter(letter: string, houseType: string = 'all') {
  return useQuery({
    queryKey: queryKeys.perfumes.byLetter(letter, houseType),
    queryFn: () => getPerfumesByLetter(letter, houseType),
    staleTime: 5 * 60 * 1000,
    enabled: !!letter,
  })
}
```

---

## Common Pitfalls to Avoid

1. **Don't forget to enable React Query DevTools** in development
2. **Don't mix manual caching with TanStack Query** - remove localStorage cache logic
3. **Don't duplicate data** - use `initialData` from loaders, don't re-fetch immediately
4. **Do invalidate queries after mutations** - keep cache in sync
5. **Do use query key factories** - makes invalidation easier
6. **Do handle API response format** - your APIs return `{ success, data, message }`
7. **Do set appropriate `staleTime`** - aligns with current 5-minute cache
8. **Don't forget `enabled` option** - for conditional queries

---

## Testing Tips

1. **Mock query client in tests**:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// In test
const queryClient = createTestQueryClient()
render(
  <QueryClientProvider client={queryClient}>
    <YourComponent />
  </QueryClientProvider>
)
```

2. **Wait for queries**:
```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(queryClient.getQueryState(['houses', 'byLetter', 'A'])).toBeDefined()
})
```

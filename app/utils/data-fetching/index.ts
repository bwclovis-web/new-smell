/**
 * Consolidated data fetching utilities
 *
 * This module exports unified data fetching patterns that replace
 * scattered implementations across the codebase. Use these utilities
 * for consistent data loading, error handling, caching, and pagination.
 *
 * @module data-fetching
 *
 * @example Basic data fetching
 * ```tsx
 * import { useDataFetching } from '~/utils/data-fetching'
 *
 * const { data, isLoading, error } = useDataFetching<User[]>({
 *   url: '/api/users'
 * })
 * ```
 *
 * @example Paginated data
 * ```tsx
 * import { usePaginatedData } from '~/utils/data-fetching'
 *
 * const { data, nextPage, prevPage, meta } = usePaginatedData<Perfume>({
 *   baseUrl: '/api/perfumes',
 *   pageSize: 20
 * })
 * ```
 *
 * @example Helper functions
 * ```tsx
 * import { buildQueryString, withCache } from '~/utils/data-fetching'
 *
 * const url = buildQueryString('/api/perfumes', { type: 'niche', page: 1 })
 * const cachedFetch = withCache(fetchFunction, 'perfumes-cache', 300000)
 * ```
 */

// Re-export hooks
export type {
  UseDataFetchingOptions,
  UseDataFetchingReturn,
} from "~/hooks/useDataFetching"
export { useDataFetching } from "~/hooks/useDataFetching"
export type {
  PaginatedResponse,
  PaginationMeta,
  UsePaginatedDataOptions,
  UsePaginatedDataReturn,
} from "~/hooks/usePaginatedData"
export { usePaginatedData } from "~/hooks/usePaginatedData"

// Re-export related utilities
export type {
  UseApiWithRetryOptions,
  UseApiWithRetryReturn,
} from "~/hooks/useApiWithRetry"
export { useApiWithRetry } from "~/hooks/useApiWithRetry"
export { useDebouncedSearch } from "~/hooks/useDebouncedSearch"

/**
 * Build a query string from an object of parameters
 *
 * @example
 * ```ts
 * buildQueryString('/api/perfumes', { type: 'niche', page: 1 })
 * // Returns: '/api/perfumes?type=niche&page=1'
 * ```
 */
export function buildQueryString(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Wrap a fetch function with caching
 *
 * @example
 * ```ts
 * const cachedFetch = withCache(
 *   () => fetch('/api/data').then(r => r.json()),
 *   'my-cache-key',
 *   300000 // 5 minutes
 * )
 * ```
 */
export function withCache<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  cacheDuration: number = 300000
): () => Promise<T> {
  return async () => {
    // Check cache
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`data-fetch-${cacheKey}`)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < cacheDuration) {
            return data as T
          }
        }
      } catch {
        // Ignore cache errors
      }
    }

    // Fetch fresh data
    const data = await fetchFn()

    // Store in cache
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `data-fetch-${cacheKey}`,
          JSON.stringify({ data, timestamp: Date.now() })
        )
      } catch {
        // Ignore cache errors
      }
    }

    return data
  }
}

/**
 * Standard API response type for consistent error handling
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: Record<string, any>
}

/**
 * Parse API response and handle errors
 *
 * @example
 * ```ts
 * const result = await parseApiResponse<User[]>(
 *   fetch('/api/users').then(r => r.json())
 * )
 * ```
 */
export async function parseApiResponse<T>(responsePromise: Promise<Response>): Promise<T> {
  const response = await responsePromise

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const json: ApiResponse<T> = await response.json()

  if (!json.success) {
    throw new Error(json.error || json.message || "API request failed")
  }

  if (json.data === undefined) {
    throw new Error("API response missing data field")
  }

  return json.data
}

/**
 * Create a fetch function with default options
 *
 * @example
 * ```ts
 * const apiFetch = createFetchFn({
 *   baseUrl: '/api',
 *   headers: { 'X-Custom-Header': 'value' }
 * })
 *
 * const data = await apiFetch('/users')
 * ```
 */
export function createFetchFn(options: {
  baseUrl?: string
  headers?: Record<string, string>
  credentials?: RequestCredentials
}) {
  const { baseUrl = "", headers = {}, credentials = "same-origin" } = options

  return async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
    const url = `${baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...init?.headers,
      },
      credentials,
    })

    return parseApiResponse<T>(response)
  }
}

/**
 * Retry a fetch function with exponential backoff
 * (Use useApiWithRetry hook for React components)
 *
 * @example
 * ```ts
 * const data = await retryFetch(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * )
 * ```
 */
export async function retryFetch<T>(
  fetchFn: () => Promise<T>,
  options: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
  } = options

  let lastError: Error | null = null
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetchFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
 break 
}

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))

      // Exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay)
    }
  }

  throw lastError
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  if (typeof window === "undefined") {
 return 
}

  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith("data-fetch-")) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  count: number
  totalSize: number
  keys: string[]
} {
  if (typeof window === "undefined") {
    return { count: 0, totalSize: 0, keys: [] }
  }

  const keys = Object.keys(localStorage).filter(key => key.startsWith("data-fetch-"))

  const totalSize = keys.reduce((acc, key) => {
    const value = localStorage.getItem(key)
    return acc + (value?.length || 0)
  }, 0)

  return {
    count: keys.length,
    totalSize,
    keys: keys.map(k => k.replace("data-fetch-", "")),
  }
}





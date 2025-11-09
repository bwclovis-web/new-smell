/**
 * Stale-While-Revalidate Pattern Utilities
 * 
 * Implements the stale-while-revalidate pattern for TanStack Query.
 * This pattern shows cached (potentially stale) data immediately while
 * fetching fresh data in the background.
 * 
 * Benefits:
 * - Instant UI updates (no loading states for cached data)
 * - Background updates keep data fresh
 * - Better user experience with perceived performance
 */

import type { QueryOptions } from '@tanstack/react-query'

/**
 * Stale-while-revalidate configuration options
 */
export interface StaleWhileRevalidateOptions {

  /**
   * Stale time in milliseconds
   * Data is considered fresh for this duration
   * Default: 5 minutes
   */
  staleTime?: number

  /**
   * Garbage collection time in milliseconds
   * How long unused data stays in cache
   * Default: 10 minutes
   */
  gcTime?: number

  /**
   * Whether to refetch in background when data becomes stale
   * Default: true
   */
  refetchOnMount?: boolean | 'always'

  /**
   * Whether to refetch when window gains focus
   * Default: true (only if stale)
   */
  refetchOnWindowFocus?: boolean | ((query: any) => boolean)

  /**
   * Whether to refetch on network reconnect
   * Default: true
   */
  refetchOnReconnect?: boolean

  /**
   * Placeholder data to show while initial data loads
   * Useful for optimistic UI rendering
   * 
   * Note: In TanStack Query v5, previous data is automatically kept
   * during refetch, so this pattern works out of the box.
   */
  placeholderData?: unknown
}

/**
 * Create query options with stale-while-revalidate pattern
 * 
 * @example
 * ```ts
 * const { data } = useQuery({
 *   ...staleWhileRevalidate({
 *     staleTime: 5 * 60 * 1000,
 *   }),
 *   queryKey: ['houses'],
 *   queryFn: getHouses,
 * })
 * ```
 */
export function staleWhileRevalidate(options: StaleWhileRevalidateOptions = {}): Partial<QueryOptions<any, any>> {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    refetchOnMount = true,
    refetchOnWindowFocus = (query: any) => {
      // Only refetch if data is stale
      const staleThreshold = staleTime
      const now = Date.now()
      return now - query.state.dataUpdatedAt > staleThreshold
    },
    refetchOnReconnect = true,
    placeholderData,
  } = options

  return {
    staleTime,
    gcTime,
    refetchOnMount,
    refetchOnWindowFocus,
    refetchOnReconnect,
    // Note: In TanStack Query v5, placeholderData is used for optimistic UI
    // and the previous data is automatically kept during refetch
    ...(placeholderData && { placeholderData }),
  }
}

/**
 * Stale-while-revalidate presets for common use cases
 */
export const staleWhileRevalidatePresets = {

  /**
   * Fast updates - data updates frequently but we want instant UI
   * Use for: Real-time feeds, notifications, live data
   */
  fast: staleWhileRevalidate({
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  }),

  /**
   * Standard updates - balanced approach for most data
   * Use for: Lists, dashboards, user data
   */
  standard: staleWhileRevalidate({
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: query => {
      const staleThreshold = 5 * 60 * 1000
      return Date.now() - query.state.dataUpdatedAt > staleThreshold
    },
  }),

  /**
   * Slow updates - data changes infrequently
   * Use for: Static content, archived data, historical data
   */
  slow: staleWhileRevalidate({
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: query => {
      const staleThreshold = 15 * 60 * 1000
      return Date.now() - query.state.dataUpdatedAt > staleThreshold
    },
  }),

  /**
   * Aggressive updates - always refetch in background
   * Use for: Critical data that must be kept fresh
   */
  aggressive: staleWhileRevalidate({
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  }),
}

/**
 * Hook helper for stale-while-revalidate pattern
 * Returns query options that can be spread into useQuery
 * 
 * @example
 * ```tsx
 * const { data, isFetching } = useQuery({
 *   ...useStaleWhileRevalidate('standard'),
 *   queryKey: ['houses'],
 *   queryFn: getHouses,
 * })
 * 
 * // Show cached data immediately, isFetching indicates background update
 * if (data) {
 *   return <div>{data.map(...)}</div>
 * }
 * ```
 */
export function useStaleWhileRevalidate(preset: keyof typeof staleWhileRevalidatePresets = 'standard'): Partial<QueryOptions<any, any>> {
  return staleWhileRevalidatePresets[preset]
}

/**
 * Create a custom stale-while-revalidate configuration
 * 
 * @example
 * ```ts
 * const swrConfig = createStaleWhileRevalidate({
 *   staleTime: 2 * 60 * 1000,
 *   refetchOnWindowFocus: true,
 * })
 * 
 * const { data } = useQuery({
 *   ...swrConfig,
 *   queryKey: ['houses'],
 *   queryFn: getHouses,
 * })
 * ```
 */
export function createStaleWhileRevalidate(options: StaleWhileRevalidateOptions): Partial<QueryOptions<any, any>> {
  return staleWhileRevalidate(options)
}


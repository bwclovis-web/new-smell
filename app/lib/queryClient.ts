import { QueryClient, type RetryOptions } from '@tanstack/react-query'

/**
 * Query types for different retry strategies
 */
export type QueryType = 
  | 'critical'      // Critical data (user profile, auth) - aggressive retry
  | 'important'     // Important data (houses, perfumes) - standard retry
  | 'optional'      // Optional data (stats, analytics) - minimal retry
  | 'real-time'     // Real-time data - no retry, refetch instead
  | 'background'    // Background data - low priority retry

/**
 * Retry configuration for different query types
 */
export const retryConfigs: Record<QueryType, RetryOptions | number | boolean> = {
  // Critical queries: Retry aggressively (5 attempts with exponential backoff)
  critical: (failureCount, error) => {
    // Don't retry on 4xx errors (client errors)
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number
      if (status >= 400 && status < 500) {
        return false
      }
    }
    // Retry up to 5 times with exponential backoff
    if (failureCount >= 5) {
      return false
    }
    return true
  },
  
  // Important queries: Standard retry (3 attempts)
  important: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number
      if (status >= 400 && status < 500) {
        return false
      }
    }
    // Retry up to 3 times
    if (failureCount >= 3) {
      return false
    }
    return true
  },
  
  // Optional queries: Minimal retry (1 attempt)
  optional: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number
      if (status >= 400 && status < 500) {
        return false
      }
    }
    // Retry only once
    if (failureCount >= 1) {
      return false
    }
    return true
  },
  
  // Real-time queries: No retry (rely on refetch intervals)
  'real-time': false,
  
  // Background queries: Single retry with delay
  background: (failureCount) => {
    if (failureCount >= 1) {
      return false
    }
    return true
  },
}

/**
 * Get retry configuration for a query type
 */
export function getRetryConfig(queryType: QueryType = 'important'): RetryOptions | number | boolean {
  return retryConfigs[queryType]
}

/**
 * Creates and configures a QueryClient instance with default options
 * for TanStack Query v5.
 * 
 * Default Configuration:
 * - staleTime: 5 minutes (aligns with current cache duration)
 * - gcTime: 10 minutes (formerly cacheTime in v4)
 * - retry: 3 attempts (configurable per query type)
 * - refetchOnWindowFocus: false (set per-query for better control)
 * - refetchOnReconnect: true (refetch when network reconnects)
 * 
 * Background Refetching:
 * - Default: No automatic refetchInterval (set per-query as needed)
 * - Use refetchInterval for real-time data (alerts, notifications, live stats)
 * - Use refetchOnWindowFocus strategically (only when data should refresh on tab focus)
 * - Implement stale-while-revalidate pattern for better UX
 * 
 * Error Handling:
 * - Global error handler for unhandled query errors
 * - Per-query-type retry strategies
 * 
 * @see app/lib/utils/backgroundRefetch.ts for refetch strategies
 * @see app/lib/utils/staleWhileRevalidate.ts for SWR pattern
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
        retry: retryConfigs.important, // Default to 'important' retry strategy
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Global error handler for queries
        onError: (error) => {
          // Log query errors for monitoring
          console.error('Query error:', error)
          // In production, you might want to send this to an error tracking service
          // e.g., Sentry, LogRocket, etc.
        },
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors like validation)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number
            if (status >= 400 && status < 500) {
              return false
            }
          }
          // Retry up to 2 times for mutations
          if (failureCount >= 2) {
            return false
          }
          return true
        },
        // Global error handler for mutations
        onError: (error) => {
          console.error('Mutation error:', error)
        },
      },
    },
  })
}

// Export singleton instance
export const queryClient = createQueryClient()


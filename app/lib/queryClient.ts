import { QueryClient } from '@tanstack/react-query'

/**
 * Creates and configures a QueryClient instance with default options
 * for TanStack Query v5.
 * 
 * Default Configuration:
 * - staleTime: 5 minutes (aligns with current cache duration)
 * - gcTime: 10 minutes (formerly cacheTime in v4)
 * - retry: 3 attempts
 * - refetchOnWindowFocus: false
 * - refetchOnReconnect: true
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
        retry: 3,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 2,
      },
    },
  })
}

// Export singleton instance
export const queryClient = createQueryClient()


import type { QueryOptions, MutationOptions } from '@tanstack/react-query'
import type { QueryType, RetryOptions } from '../queryClient'

/**
 * Helper to create query options with specific retry configuration
 * 
 * @example
 * ```ts
 * const queryOptions = withRetryConfig(
 *   {
 *     queryKey: ['houses'],
 *     queryFn: getHouses,
 *   },
 *   'critical'
 * )
 * ```
 */
export function withRetryConfig<TData, TError>(
  options: QueryOptions<TData, TError>,
  queryType: QueryType = 'important'
): QueryOptions<TData, TError> {
  const { getRetryConfig } = require('../queryClient')
  
  return {
    ...options,
    retry: getRetryConfig(queryType),
  }
}

/**
 * Helper to create mutation options with specific retry configuration
 */
export function withMutationRetryConfig<TData, TError, TVariables>(
  options: MutationOptions<TData, TError, TVariables>,
  retry: boolean | number | RetryOptions = true
): MutationOptions<TData, TError, TVariables> {
  return {
    ...options,
    retry,
  }
}

/**
 * Smart retry function that determines retry based on error type
 * 
 * Returns false (don't retry) for:
 * - 4xx client errors (except 408 Request Timeout and 429 Too Many Requests)
 * - Network errors after 3 attempts
 * 
 * Returns true (retry) for:
 * - 5xx server errors
 * - 408 Request Timeout
 * - 429 Too Many Requests (with backoff)
 * - Network errors (up to limit)
 */
export function smartRetry(
  failureCount: number,
  error: unknown,
  maxRetries: number = 3
): boolean {
  // Don't retry if exceeded max retries
  if (failureCount >= maxRetries) {
    return false
  }

  // Handle HTTP error responses
  if (error && typeof error === 'object') {
    // Check for Response object
    if ('status' in error) {
      const status = error.status as number

      // Always retry on server errors (5xx)
      if (status >= 500) {
        return true
      }

      // Retry on timeout and rate limit (with backoff)
      if (status === 408 || status === 429) {
        return true
      }

      // Don't retry on client errors (4xx) except timeout/rate limit
      if (status >= 400 && status < 500) {
        return false
      }
    }

    // Check for Error with message containing status code
    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      // Network errors - retry
      if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout')
      ) {
        return true
      }

      // Client errors - don't retry
      if (
        message.includes('404') ||
        message.includes('403') ||
        message.includes('401') ||
        message.includes('400') ||
        message.includes('validation')
      ) {
        return false
      }
    }
  }

  // Default: retry for unknown errors
  return true
}

/**
 * Preset retry configurations for common scenarios
 */
export const retryPresets = {
  /**
   * No retry - for non-critical queries or when errors are expected
   */
  none: false,

  /**
   * Single retry - for optional data
   */
  once: 1,

  /**
   * Standard retry (3 attempts) - for important data
   */
  standard: 3,

  /**
   * Aggressive retry (5 attempts) - for critical data
   */
  aggressive: 5,

  /**
   * Smart retry - adapts based on error type
   */
  smart: smartRetry,

  /**
   * Network-only retry - only retries on network errors
   */
  networkOnly: (failureCount: number, error: unknown) => {
    if (failureCount >= 3) return false

    if (error && typeof error === 'object') {
      if ('status' in error) {
        // Don't retry HTTP errors (server handles those)
        return false
      }

      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        // Only retry on network errors
        return (
          message.includes('network') ||
          message.includes('fetch') ||
          message.includes('timeout')
        )
      }
    }

    return false
  },
} as const


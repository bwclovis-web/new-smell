/**
 * Retry utility for handling transient failures
 *
 * Provides exponential backoff retry mechanism for API calls and other operations
 * that may fail transiently due to network issues or temporary service unavailability.
 */

import { AppError } from "./errorHandling"

export interface RetryOptions {

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  delay?: number

  /**
   * Backoff strategy: 'linear' or 'exponential'
   * - linear: delay * (attempt + 1)
   * - exponential: delay * 2^attempt
   * @default 'exponential'
   */
  backoff?: "linear" | "exponential"

  /**
   * Custom function to determine if error is retryable
   * @default isRetryableError
   */
  retryCondition?: (error: unknown) => boolean

  /**
   * Maximum delay cap in milliseconds (prevents exponential backoff from getting too large)
   * @default 30000 (30 seconds)
   */
  maxDelay?: number

  /**
   * Optional callback called before each retry attempt
   */
  onRetry?: (error: unknown, attempt: number, nextDelay: number) => void

  /**
   * Optional callback called when all retries are exhausted
   */
  onMaxRetriesReached?: (error: unknown, attempts: number) => void
}

/**
 * Retry an async operation with configurable backoff strategy
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws The last error if all retry attempts fail
 *
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxRetries: 3, backoff: 'exponential' }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = "exponential",
    retryCondition = isRetryableError,
    maxDelay = 30000,
    onRetry,
    onMaxRetriesReached,
  } = options

  let lastError: unknown
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      attempt++

      // Don't retry if we've exhausted attempts
      if (attempt > maxRetries) {
        onMaxRetriesReached?.(error, attempt - 1)
        break
      }

      // Don't retry if error is not retryable
      if (!retryCondition(error)) {
        throw error
      }

      // Calculate delay with backoff
      const calculatedDelay =
        backoff === "exponential"
          ? delay * Math.pow(2, attempt - 1)
          : delay * attempt

      // Cap the delay at maxDelay
      const nextDelay = Math.min(calculatedDelay, maxDelay)

      // Notify about retry attempt
      onRetry?.(error, attempt, nextDelay)

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, nextDelay))
    }
  }

  // All retries exhausted, throw the last error
  throw lastError
}

/**
 * Determines if an error is retryable
 *
 * By default, retries:
 * - Network errors (AppError with type 'NETWORK')
 * - Temporary server errors (AppError with type 'SERVER' and not CRITICAL severity)
 * - HTTP 5xx errors (except 501 Not Implemented)
 * - Network-related native errors (TypeError, fetch failures)
 *
 * Does NOT retry:
 * - Authentication errors (401)
 * - Authorization errors (403)
 * - Validation errors (400)
 * - Not Found errors (404)
 * - Client errors (4xx except 408, 429)
 * - Critical errors
 *
 * @param error - The error to check
 * @returns true if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  // Handle AppError instances
  if (error instanceof AppError) {
    // Retry network errors
    if (error.type === "NETWORK") {
      return true
    }

    // Retry server errors that are not critical
    if (error.type === "SERVER" && error.severity !== "CRITICAL") {
      return true
    }

    // Don't retry other AppError types (validation, auth, not found, etc.)
    return false
  }

  // Handle Response objects (fetch API)
  if (error instanceof Response) {
    const status = error.status

    // Retry 5xx errors except 501 (Not Implemented)
    if (status >= 500 && status !== 501) {
      return true
    }

    // Retry specific 4xx errors that are temporary
    if (status === 408 || status === 429) {
      // Request Timeout, Too Many Requests
      return true
    }

    // Don't retry other HTTP errors
    return false
  }

  // Handle native Error objects
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // Retry network-related errors
    const networkErrorPatterns = [
      "network",
      "fetch",
      "timeout",
      "econnrefused",
      "econnreset",
      "etimedout",
      "enotfound",
      "unable to connect",
      "connection refused",
      "socket hang up",
    ]

    return networkErrorPatterns.some(pattern => errorMessage.includes(pattern))
  }

  // For unknown error types, don't retry by default
  return false
}

/**
 * Create a retryable version of an async function
 *
 * @param fn - The async function to make retryable
 * @param options - Default retry options
 * @returns A new function that automatically retries on failure
 *
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryable(
 *   (url: string) => fetch(url).then(r => r.json()),
 *   { maxRetries: 3 }
 * )
 *
 * const data = await fetchWithRetry('/api/data')
 * ```
 */
export function createRetryable<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  defaultOptions: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => withRetry(() => fn(...args), defaultOptions)
}

/**
 * Retry configuration presets for common scenarios
 */
export const retryPresets = {

  /**
   * Conservative retry: 2 attempts, 2s initial delay, exponential backoff
   * Good for user-facing operations where quick failure is better than long waits
   */
  conservative: {
    maxRetries: 2,
    delay: 2000,
    backoff: "exponential" as const,
    maxDelay: 8000,
  },

  /**
   * Standard retry: 3 attempts, 1s initial delay, exponential backoff
   * Good for most API calls and operations
   */
  standard: {
    maxRetries: 3,
    delay: 1000,
    backoff: "exponential" as const,
    maxDelay: 15000,
  },

  /**
   * Aggressive retry: 5 attempts, 500ms initial delay, exponential backoff
   * Good for critical operations where success is important
   */
  aggressive: {
    maxRetries: 5,
    delay: 500,
    backoff: "exponential" as const,
    maxDelay: 30000,
  },

  /**
   * Quick retry: 3 attempts, 100ms initial delay, linear backoff
   * Good for fast operations like cache checks
   */
  quick: {
    maxRetries: 3,
    delay: 100,
    backoff: "linear" as const,
    maxDelay: 1000,
  },
} as const

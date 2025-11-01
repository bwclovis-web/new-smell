/**
 * Tests for retry utility
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppError, createError } from '../../../app/utils/errorHandling'
import {
  createRetryable,
  isRetryableError,
  type RetryOptions,
  retryPresets,
  withRetry} from '../../../app/utils/retry'

describe('retry utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('withRetry', () => {
    describe('successful operations', () => {
      it('should return result on first attempt if successful', async () => {
        const fn = vi.fn().mockResolvedValue('success')

        const result = await withRetry(fn)

        expect(result).toBe('success')
        expect(fn).toHaveBeenCalledTimes(1)
      })

      it('should return result after retries', async () => {
        let attempts = 0
        const fn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 3) {
            throw createError.network('Network error')
          }
          return Promise.resolve('success')
        })

        const promise = withRetry(fn, { maxRetries: 3, delay: 100 })
        
        // Run timers to advance through delays
        await act(async () => {
          for (let i = 0; i < 3; i++) {
            await vi.advanceTimersByTimeAsync(200)
          }
        })
        
        const result = await promise

        expect(result).toBe('success')
        expect(fn).toHaveBeenCalledTimes(3)
      })
    })

    describe('retry behavior', () => {
      it('should retry on network errors', async () => {
        let attempts = 0
        const fn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts <= 2) {
            throw createError.network('Network error')
          }
          return Promise.resolve('success')
        })

        const promise = withRetry(fn, { maxRetries: 3, delay: 10 })
        await vi.runAllTimersAsync()
        const result = await promise

        expect(result).toBe('success')
        expect(fn).toHaveBeenCalledTimes(3)
      })

      it('should retry on server errors', async () => {
        let attempts = 0
        const fn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 2) {
            throw createError.server('Server error')
          }
          return Promise.resolve('success')
        })

        const promise = withRetry(fn, { maxRetries: 3, delay: 10 })
        await vi.runAllTimersAsync()
        const result = await promise

        expect(result).toBe('success')
        expect(fn).toHaveBeenCalledTimes(2)
      })

      it('should not retry on validation errors', async () => {
        const fn = vi.fn().mockImplementation(() => {
          throw createError.validation('Invalid input')
        })

        const promise = withRetry(fn, { maxRetries: 3, delay: 10 })

        await expect(promise).rejects.toThrow('Invalid input')
        expect(fn).toHaveBeenCalledTimes(1)
      })

      it('should not retry on authentication errors', async () => {
        const fn = vi.fn().mockImplementation(() => {
          throw createError.authentication('Not authenticated')
        })

        const promise = withRetry(fn, { maxRetries: 3, delay: 10 })

        await expect(promise).rejects.toThrow('Not authenticated')
        expect(fn).toHaveBeenCalledTimes(1)
      })

      it('should exhaust retries and throw last error', async () => {
        const fn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const promise = withRetry(fn, { maxRetries: 3, delay: 10 })
        await vi.runAllTimersAsync()

        await expect(promise).rejects.toThrow('Network error')
        expect(fn).toHaveBeenCalledTimes(4) // Initial + 3 retries
      })
    })

    describe('backoff strategies', () => {
      it('should use exponential backoff by default', async () => {
        const delays: number[] = []
        const fn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const promise = withRetry(fn, {
          maxRetries: 3,
          delay: 100,
          onRetry: (_, attempt, nextDelay) => {
            delays.push(nextDelay)
          }
        })

        await vi.runAllTimersAsync()
        await promise.catch(() => { })

        // Exponential: 100, 200, 400
        expect(delays).toEqual([100, 200, 400])
      })

      it('should use linear backoff when specified', async () => {
        const delays: number[] = []
        const fn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const promise = withRetry(fn, {
          maxRetries: 3,
          delay: 100,
          backoff: 'linear',
          onRetry: (_, attempt, nextDelay) => {
            delays.push(nextDelay)
          }
        })

        await vi.runAllTimersAsync()
        await promise.catch(() => { })

        // Linear: 100, 200, 300
        expect(delays).toEqual([100, 200, 300])
      })

      it('should cap delay at maxDelay', async () => {
        const delays: number[] = []
        const fn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const promise = withRetry(fn, {
          maxRetries: 5,
          delay: 1000,
          maxDelay: 3000,
          onRetry: (_, attempt, nextDelay) => {
            delays.push(nextDelay)
          }
        })

        await vi.runAllTimersAsync()
        await promise.catch(() => { })

        // Exponential capped: 1000, 2000, 3000, 3000, 3000
        expect(delays[0]).toBe(1000)
        expect(delays[1]).toBe(2000)
        expect(delays[2]).toBe(3000)
        expect(delays[3]).toBe(3000)
        expect(delays[4]).toBe(3000)
      })
    })

    describe('custom retry conditions', () => {
      it('should use custom retry condition when provided', async () => {
        const customCondition = vi.fn().mockReturnValue(true)
        const fn = vi.fn().mockRejectedValue(new Error('Custom error'))

        const promise = withRetry(fn, {
          maxRetries: 2,
          delay: 10,
          retryCondition: customCondition
        })

        await vi.runAllTimersAsync()
        await promise.catch(() => { })

        expect(customCondition).toHaveBeenCalledTimes(3) // Initial + 2 retries
        expect(fn).toHaveBeenCalledTimes(3)
      })

      it('should stop retrying when custom condition returns false', async () => {
        let callCount = 0
        const customCondition = vi.fn().mockImplementation(() => {
          callCount++
          return callCount < 2 // Only retry once
        })
        const fn = vi.fn().mockRejectedValue(new Error('Custom error'))

        const promise = withRetry(fn, {
          maxRetries: 5,
          delay: 10,
          retryCondition: customCondition
        })

        await vi.runAllTimersAsync()
        await promise.catch(() => { })

        expect(fn).toHaveBeenCalledTimes(2) // Initial + 1 retry
      })
    })

    describe('callbacks', () => {
      it('should call onRetry callback before each retry', async () => {
        const onRetry = vi.fn()
        const fn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const promise = withRetry(fn, {
          maxRetries: 2,
          delay: 10,
          onRetry
        })

        await vi.runAllTimersAsync()
        await promise.catch(() => { })

        expect(onRetry).toHaveBeenCalledTimes(2)
        expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(AppError), 1, 10)
        expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(AppError), 2, 20)
      })

      it('should call onMaxRetriesReached when retries exhausted', async () => {
        const onMaxRetriesReached = vi.fn()
        const fn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const promise = withRetry(fn, {
          maxRetries: 2,
          delay: 10,
          onMaxRetriesReached
        })

        await vi.runAllTimersAsync()
        await promise.catch(() => { })

        expect(onMaxRetriesReached).toHaveBeenCalledTimes(1)
        expect(onMaxRetriesReached).toHaveBeenCalledWith(expect.any(AppError), 2)
      })

      it('should not call onMaxRetriesReached on success', async () => {
        const onMaxRetriesReached = vi.fn()
        let attempts = 0
        const fn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 2) {
            throw createError.network('Network error')
          }
          return Promise.resolve('success')
        })

        const promise = withRetry(fn, {
          maxRetries: 3,
          delay: 10,
          onMaxRetriesReached
        })

        await vi.runAllTimersAsync()
        await promise

        expect(onMaxRetriesReached).not.toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      it('should handle maxRetries = 0 (no retries)', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('Error'))

        const promise = withRetry(fn, { maxRetries: 0, delay: 10 })

        await expect(promise).rejects.toThrow('Error')
        expect(fn).toHaveBeenCalledTimes(1)
      })

      it('should handle very short delays', async () => {
        let attempts = 0
        const fn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 3) {
            throw createError.network('Network error')
          }
          return Promise.resolve('success')
        })

        const promise = withRetry(fn, { maxRetries: 3, delay: 1 })
        await vi.runAllTimersAsync()
        const result = await promise

        expect(result).toBe('success')
        expect(fn).toHaveBeenCalledTimes(3)
      })

      it('should handle undefined delay', async () => {
        let attempts = 0
        const fn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 2) {
            throw createError.network('Network error')
          }
          return Promise.resolve('success')
        })

        const promise = withRetry(fn, { maxRetries: 2 })
        await vi.runAllTimersAsync()
        const result = await promise

        expect(result).toBe('success')
      })
    })
  })

  describe('isRetryableError', () => {
    describe('AppError instances', () => {
      it('should return true for NETWORK errors', () => {
        const error = createError.network('Network error')
        expect(isRetryableError(error)).toBe(true)
      })

      it('should return true for SERVER errors with non-CRITICAL severity', () => {
        const error = createError.server('Server error')
        expect(isRetryableError(error)).toBe(true)
      })

      it('should return false for CRITICAL SERVER errors', () => {
        const error = new AppError(
          'Critical server error',
          'SERVER',
          'CRITICAL'
        )
        expect(isRetryableError(error)).toBe(false)
      })

      it('should return false for VALIDATION errors', () => {
        const error = createError.validation('Invalid input')
        expect(isRetryableError(error)).toBe(false)
      })

      it('should return false for AUTHENTICATION errors', () => {
        const error = createError.authentication('Not authenticated')
        expect(isRetryableError(error)).toBe(false)
      })

      it('should return false for AUTHORIZATION errors', () => {
        const error = createError.authorization('Not authorized')
        expect(isRetryableError(error)).toBe(false)
      })

      it('should return false for NOT_FOUND errors', () => {
        const error = createError.notFound('Resource not found')
        expect(isRetryableError(error)).toBe(false)
      })

      it('should return false for CLIENT errors', () => {
        const error = createError.client('Client error')
        expect(isRetryableError(error)).toBe(false)
      })
    })

    describe('Response objects', () => {
      it('should return true for 5xx errors', () => {
        const error = new Response(null, { status: 500 })
        expect(isRetryableError(error)).toBe(true)

        const error502 = new Response(null, { status: 502 })
        expect(isRetryableError(error502)).toBe(true)

        const error503 = new Response(null, { status: 503 })
        expect(isRetryableError(error503)).toBe(true)
      })

      it('should return false for 501 Not Implemented', () => {
        const error = new Response(null, { status: 501 })
        expect(isRetryableError(error)).toBe(false)
      })

      it('should return true for 408 Request Timeout', () => {
        const error = new Response(null, { status: 408 })
        expect(isRetryableError(error)).toBe(true)
      })

      it('should return true for 429 Too Many Requests', () => {
        const error = new Response(null, { status: 429 })
        expect(isRetryableError(error)).toBe(true)
      })

      it('should return false for 4xx errors (except 408, 429)', () => {
        const error400 = new Response(null, { status: 400 })
        expect(isRetryableError(error400)).toBe(false)

        const error401 = new Response(null, { status: 401 })
        expect(isRetryableError(error401)).toBe(false)

        const error403 = new Response(null, { status: 403 })
        expect(isRetryableError(error403)).toBe(false)

        const error404 = new Response(null, { status: 404 })
        expect(isRetryableError(error404)).toBe(false)
      })

      it('should return false for 2xx success', () => {
        const error = new Response(null, { status: 200 })
        expect(isRetryableError(error)).toBe(false)
      })
    })

    describe('Native Error objects', () => {
      it('should return true for network-related errors', () => {
        expect(isRetryableError(new Error('Network error occurred'))).toBe(true)
        expect(isRetryableError(new Error('fetch failed'))).toBe(true)
        expect(isRetryableError(new Error('Request timeout'))).toBe(true)
        expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true)
        expect(isRetryableError(new Error('ECONNRESET'))).toBe(true)
        expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true)
        expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true)
        expect(isRetryableError(new Error('Unable to connect'))).toBe(true)
        expect(isRetryableError(new Error('Connection refused'))).toBe(true)
        expect(isRetryableError(new Error('socket hang up'))).toBe(true)
      })

      it('should return false for non-network errors', () => {
        expect(isRetryableError(new Error('Validation failed'))).toBe(false)
        expect(isRetryableError(new Error('Not found'))).toBe(false)
        expect(isRetryableError(new Error('Permission denied'))).toBe(false)
      })

      it('should be case-insensitive for error messages', () => {
        expect(isRetryableError(new Error('NETWORK ERROR'))).toBe(true)
        expect(isRetryableError(new Error('Network Error'))).toBe(true)
        expect(isRetryableError(new Error('FETCH FAILED'))).toBe(true)
      })
    })

    describe('unknown error types', () => {
      it('should return false for unknown error types', () => {
        expect(isRetryableError('string error')).toBe(false)
        expect(isRetryableError(123)).toBe(false)
        expect(isRetryableError(null)).toBe(false)
        expect(isRetryableError(undefined)).toBe(false)
        expect(isRetryableError({})).toBe(false)
      })
    })
  })

  describe('createRetryable', () => {
    it('should create a retryable function', async () => {
      let attempts = 0
      const originalFn = vi.fn((value: string) => {
        attempts++
        if (attempts < 2) {
          return Promise.reject(createError.network('Network error'))
        }
        return Promise.resolve(`Result: ${value}`)
      })

      const retryableFn = createRetryable(originalFn, { maxRetries: 3, delay: 10 })

      const promise = retryableFn('test')
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('Result: test')
      expect(originalFn).toHaveBeenCalledTimes(2)
    })

    it('should preserve function arguments', async () => {
      const originalFn = vi.fn((a: number, b: number) => Promise.resolve(a + b))
      const retryableFn = createRetryable(originalFn)

      const promise = retryableFn(1, 2)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe(3)
      expect(originalFn).toHaveBeenCalledWith(1, 2)
    })

    it('should apply default retry options', async () => {
      const onRetry = vi.fn()
      let attempts = 0
      const originalFn = vi.fn(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(createError.network('Network error'))
        }
        return Promise.resolve('success')
      })

      const retryableFn = createRetryable(originalFn, {
        maxRetries: 5,
        delay: 10,
        onRetry
      })

      const promise = retryableFn()
      await vi.runAllTimersAsync()
      await promise

      expect(onRetry).toHaveBeenCalledTimes(2)
    })
  })

  describe('retryPresets', () => {
    it('should have conservative preset', () => {
      expect(retryPresets.conservative).toEqual({
        maxRetries: 2,
        delay: 2000,
        backoff: 'exponential',
        maxDelay: 8000
      })
    })

    it('should have standard preset', () => {
      expect(retryPresets.standard).toEqual({
        maxRetries: 3,
        delay: 1000,
        backoff: 'exponential',
        maxDelay: 15000
      })
    })

    it('should have aggressive preset', () => {
      expect(retryPresets.aggressive).toEqual({
        maxRetries: 5,
        delay: 500,
        backoff: 'exponential',
        maxDelay: 30000
      })
    })

    it('should have quick preset', () => {
      expect(retryPresets.quick).toEqual({
        maxRetries: 3,
        delay: 100,
        backoff: 'linear',
        maxDelay: 1000
      })
    })

    it('should work with withRetry', async () => {
      let attempts = 0
      const fn = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw createError.network('Network error')
        }
        return Promise.resolve('success')
      })

      const promise = withRetry(fn, retryPresets.quick)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })

  describe('performance', () => {
    it('should handle rapid retries efficiently', async () => {
      const startTime = Date.now()
      let attempts = 0
      const fn = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 10) {
          throw createError.network('Network error')
        }
        return Promise.resolve('success')
      })

      const promise = withRetry(fn, {
        maxRetries: 10,
        delay: 1,
        backoff: 'linear'
      })

      await vi.runAllTimersAsync()
      await promise

      // Should complete quickly with small delays
      expect(fn).toHaveBeenCalledTimes(10)
    })
  })
})


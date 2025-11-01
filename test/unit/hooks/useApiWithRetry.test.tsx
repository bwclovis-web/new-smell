/**
 * Tests for useApiWithRetry hook
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useApiWithRetry } from '../../../app/hooks/useApiWithRetry'
import { createError } from '../../../app/utils/errorHandling'
import { retryPresets } from '../../../app/utils/retry'

describe('useApiWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useApiWithRetry())

      expect(result.current.error).toBeNull()
      expect(result.current.isError).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isRetrying).toBe(false)
      expect(result.current.retryCount).toBe(0)
    })

    it('should accept userId option', () => {
      const { result } = renderHook(() => useApiWithRetry({ userId: 'user123' }))

      expect(result.current.error).toBeNull()
    })

    it('should accept default retry options', () => {
      const { result } = renderHook(() => useApiWithRetry({
          defaultRetryOptions: {
            maxRetries: 5,
            delay: 500
          }
        }))

      expect(result.current.error).toBeNull()
    })
  })

  describe('fetchWithRetry', () => {
    describe('successful operations', () => {
      it('should return data on successful API call', async () => {
        const mockData = { id: 1, name: 'Test' }
        const apiFn = vi.fn().mockResolvedValue(mockData)

        const { result } = renderHook(() => useApiWithRetry())

        let apiResult: any
        act(() => {
          result.current.fetchWithRetry(apiFn).then(r => {
            apiResult = r
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(apiResult).toEqual(mockData)
        })
        expect(apiFn).toHaveBeenCalledTimes(1)
        expect(result.current.isError).toBe(false)
      })

      it('should set loading state during API call', async () => {
        const apiFn = vi.fn().mockResolvedValue('success')

        const { result } = renderHook(() => useApiWithRetry())

        act(() => {
          result.current.fetchWithRetry(apiFn)
        })

        expect(result.current.isLoading).toBe(true)

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })
      })

      it('should clear error on successful call', async () => {
        const apiFn = vi.fn()
          .mockRejectedValueOnce(createError.network('Network error'))
          .mockResolvedValueOnce('success')

        const { result } = renderHook(() => useApiWithRetry())

        // First call fails
        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 0 }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.isError).toBe(true)
        })

        // Second call succeeds
        act(() => {
          result.current.fetchWithRetry(apiFn)
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.isError).toBe(false)
          expect(result.current.error).toBeNull()
        })
      })
    })

    describe('retry behavior', () => {
      it('should retry on network errors', async () => {
        let attempts = 0
        const apiFn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 3) {
            return Promise.reject(createError.network('Network error'))
          }
          return Promise.resolve('success')
        })

        const { result } = renderHook(() => useApiWithRetry())

        let apiResult: any
        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 3, delay: 10 }
          }).then(r => {
            apiResult = r
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(apiResult).toBe('success')
        })
        expect(apiFn).toHaveBeenCalledTimes(3)
        expect(result.current.isError).toBe(false)
      })

      it('should not retry on validation errors', async () => {
        const apiFn = vi.fn().mockRejectedValue(createError.validation('Invalid input'))

        const { result } = renderHook(() => useApiWithRetry())

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 3, delay: 10 }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.isError).toBe(true)
        })
        expect(apiFn).toHaveBeenCalledTimes(1)
      })

      it('should update retry count during retries', async () => {
        let attempts = 0
        const apiFn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 3) {
            return Promise.reject(createError.network('Network error'))
          }
          return Promise.resolve('success')
        })

        const { result } = renderHook(() => useApiWithRetry())

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 3, delay: 10 }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.retryCount).toBe(0) // Reset after success
        })
      })

      it('should set isRetrying during retries', async () => {
        const apiFn = vi.fn()
          .mockRejectedValueOnce(createError.network('Network error'))
          .mockResolvedValueOnce('success')

        const { result } = renderHook(() => useApiWithRetry())

        let retryingStates: boolean[] = []

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: {
              maxRetries: 2,
              delay: 10,
              onRetry: () => {
                retryingStates.push(result.current.isRetrying)
              }
            }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.isRetrying).toBe(false)
        })
        expect(retryingStates).toContain(true)
      })

      it('should handle exhausted retries', async () => {
        const apiFn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const { result } = renderHook(() => useApiWithRetry())

        let apiResult: any
        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 2, delay: 10 }
          }).then(r => {
            apiResult = r
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(apiResult).toBeNull()
        })
        expect(apiFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
        expect(result.current.isError).toBe(true)
      })
    })

    describe('retry options', () => {
      it('should use default retry options when not specified', async () => {
        let attempts = 0
        const apiFn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 4) {
            return Promise.reject(createError.network('Network error'))
          }
          return Promise.resolve('success')
        })

        const { result } = renderHook(() => useApiWithRetry({
            defaultRetryOptions: {
              maxRetries: 5,
              delay: 10
            }
          }))

        let apiResult: any
        act(() => {
          result.current.fetchWithRetry(apiFn).then(r => {
            apiResult = r
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(apiResult).toBe('success')
        })
        expect(apiFn).toHaveBeenCalledTimes(4)
      })

      it('should override default options with call-specific options', async () => {
        const apiFn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const { result } = renderHook(() => useApiWithRetry({
            defaultRetryOptions: {
              maxRetries: 5,
              delay: 100
            }
          }))

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 1, delay: 10 }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.isError).toBe(true)
        })
        expect(apiFn).toHaveBeenCalledTimes(2) // Initial + 1 retry (overridden)
      })

      it('should handle endpoint and method in error context', async () => {
        const apiFn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const { result } = renderHook(() => useApiWithRetry())

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            endpoint: '/api/perfumes',
            method: 'GET',
            retryOptions: { maxRetries: 0 }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.isError).toBe(true)
          expect(result.current.error).toBeDefined()
        })
      })
    })

    describe('callbacks', () => {
      it('should call global onRetry callback', async () => {
        const globalOnRetry = vi.fn()
        let attempts = 0
        const apiFn = vi.fn().mockImplementation(() => {
          attempts++
          if (attempts < 3) {
            return Promise.reject(createError.network('Network error'))
          }
          return Promise.resolve('success')
        })

        const { result } = renderHook(() => useApiWithRetry({ onRetry: globalOnRetry }))

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 3, delay: 10 }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(globalOnRetry).toHaveBeenCalledTimes(2)
        })
      })

      it('should call call-specific onRetry callback', async () => {
        const callOnRetry = vi.fn()
        const apiFn = vi.fn()
          .mockRejectedValueOnce(createError.network('Network error'))
          .mockResolvedValueOnce('success')

        const { result } = renderHook(() => useApiWithRetry())

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: {
              maxRetries: 2,
              delay: 10,
              onRetry: callOnRetry
            }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(callOnRetry).toHaveBeenCalledTimes(1)
        })
      })

      it('should call global onMaxRetriesReached callback', async () => {
        const onMaxRetriesReached = vi.fn()
        const apiFn = vi.fn().mockRejectedValue(createError.network('Network error'))

        const { result } = renderHook(() => useApiWithRetry({ onMaxRetriesReached }))

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 2, delay: 10 }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(onMaxRetriesReached).toHaveBeenCalledTimes(1)
        })
      })

      it('should not call onMaxRetriesReached on success', async () => {
        const onMaxRetriesReached = vi.fn()
        const apiFn = vi.fn()
          .mockRejectedValueOnce(createError.network('Network error'))
          .mockResolvedValueOnce('success')

        const { result } = renderHook(() => useApiWithRetry({ onMaxRetriesReached }))

        act(() => {
          result.current.fetchWithRetry(apiFn, {
            retryOptions: { maxRetries: 2, delay: 10 }
          })
        })

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        await waitFor(() => {
          expect(result.current.isError).toBe(false)
        })
        expect(onMaxRetriesReached).not.toHaveBeenCalled()
      })
    })
  })

  describe('fetchWithPreset', () => {
    it('should use conservative preset', async () => {
      const apiFn = vi.fn()
        .mockRejectedValueOnce(createError.network('Network error'))
        .mockResolvedValueOnce('success')

      const { result } = renderHook(() => useApiWithRetry())

      let apiResult: any
      act(() => {
        result.current.fetchWithPreset(
          apiFn,
          'conservative',
          '/api/test',
          'GET'
        ).then(r => {
          apiResult = r
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(apiResult).toBe('success')
      })
      expect(apiFn).toHaveBeenCalledTimes(2)
    })

    it('should use standard preset', async () => {
      const apiFn = vi.fn().mockResolvedValue('success')

      const { result } = renderHook(() => useApiWithRetry())

      let apiResult: any
      act(() => {
        result.current.fetchWithPreset(apiFn, 'standard').then(r => {
          apiResult = r
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(apiResult).toBe('success')
      })
    })

    it('should use aggressive preset', async () => {
      const apiFn = vi.fn().mockResolvedValue('success')

      const { result } = renderHook(() => useApiWithRetry())

      let apiResult: any
      act(() => {
        result.current.fetchWithPreset(apiFn, 'aggressive').then(r => {
          apiResult = r
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(apiResult).toBe('success')
      })
    })

    it('should use quick preset', async () => {
      const apiFn = vi.fn().mockResolvedValue('success')

      const { result } = renderHook(() => useApiWithRetry())

      let apiResult: any
      act(() => {
        result.current.fetchWithPreset(apiFn, 'quick').then(r => {
          apiResult = r
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(apiResult).toBe('success')
      })
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const apiFn = vi.fn().mockRejectedValue(createError.network('Network error'))

      const { result } = renderHook(() => useApiWithRetry())

      act(() => {
        result.current.fetchWithRetry(apiFn, {
          retryOptions: { maxRetries: 0 }
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.isError).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('resetRetryCount', () => {
    it('should reset retry count to zero', async () => {
      const apiFn = vi.fn().mockRejectedValue(createError.network('Network error'))

      const { result } = renderHook(() => useApiWithRetry())

      act(() => {
        result.current.fetchWithRetry(apiFn, {
          retryOptions: { maxRetries: 2, delay: 10 }
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(result.current.retryCount).toBeGreaterThan(0)
      })

      act(() => {
        result.current.resetRetryCount()
      })

      expect(result.current.retryCount).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent API calls', async () => {
      const apiFn1 = vi.fn().mockResolvedValue('result1')
      const apiFn2 = vi.fn().mockResolvedValue('result2')

      const { result } = renderHook(() => useApiWithRetry())

      let result1: any
      let result2: any

      act(() => {
        result.current.fetchWithRetry(apiFn1).then(r => {
          result1 = r
        })
        result.current.fetchWithRetry(apiFn2).then(r => {
          result2 = r
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(result1).toBe('result1')
        expect(result2).toBe('result2')
      })
    })

    it('should handle undefined error gracefully', async () => {
      const apiFn = vi.fn().mockRejectedValue(undefined)

      const { result } = renderHook(() => useApiWithRetry())

      act(() => {
        result.current.fetchWithRetry(apiFn, {
          retryOptions: { maxRetries: 0 }
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })

    it('should handle string error', async () => {
      const apiFn = vi.fn().mockRejectedValue('String error')

      const { result } = renderHook(() => useApiWithRetry())

      act(() => {
        result.current.fetchWithRetry(apiFn, {
          retryOptions: { maxRetries: 0 }
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('integration scenarios', () => {
    it('should handle typical API fetch pattern', async () => {
      const mockData = [{ id: 1 }, { id: 2 }]
      const apiFn = vi.fn()
        .mockRejectedValueOnce(createError.network('Network timeout'))
        .mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => useApiWithRetry())

      let apiResult: any
      act(() => {
        result.current.fetchWithRetry(
          apiFn,
          {
            endpoint: '/api/perfumes',
            method: 'GET',
            retryOptions: retryPresets.standard
          }
        ).then(r => {
          apiResult = r
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(apiResult).toEqual(mockData)
      })
      expect(result.current.isError).toBe(false)
      expect(apiFn).toHaveBeenCalledTimes(2)
    })

    it('should handle POST request with retry', async () => {
      const mockResponse = { success: true, id: 123 }
      const apiFn = vi.fn()
        .mockRejectedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useApiWithRetry())

      let apiResult: any
      act(() => {
        result.current.fetchWithRetry(
          apiFn,
          {
            endpoint: '/api/perfumes',
            method: 'POST',
            retryOptions: retryPresets.conservative
          }
        ).then(r => {
          apiResult = r
        })
      })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      await waitFor(() => {
        expect(apiResult).toEqual(mockResponse)
      })
    })
  })
})


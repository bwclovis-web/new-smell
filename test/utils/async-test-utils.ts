import { waitFor } from '@testing-library/react'
import { expect, vi } from 'vitest'

/**
 * Async and Loading State Testing Utilities
 * 
 * Utilities for testing asynchronous operations, loading states, and timing
 */

// Wait with timeout
export const waitForWithTimeout = async <T>(
  callbackFn: () => T | Promise<T>,
  timeout = 5000,
  interval = 50
): Promise<T> => waitFor(callbackFn, { timeout, interval })

// Wait for condition
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  errorMessage = 'Condition not met within timeout'
): Promise<void> => {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(errorMessage)
    }
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

// Mock async operation
export const mockAsyncOperation = <T>(
  data: T,
  delay = 100,
  shouldFail = false
) => vi.fn().mockImplementation(() => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (shouldFail) {
      reject(new Error('Async operation failed'))
    } else {
      resolve(data)
    }
  }, delay)
}))

// Test loading state sequence
export const testLoadingStateSequence = async (
  getLoadingState: () => boolean,
  asyncOperation: () => Promise<any>,
  expectedDuration?: number
) => {
  // Should not be loading initially
  expect(getLoadingState()).toBe(false)

  // Start async operation
  const startTime = Date.now()
  const promise = asyncOperation()

  // Should be loading while operation is in progress
  await waitFor(() => {
    expect(getLoadingState()).toBe(true)
  })

  // Wait for operation to complete
  await promise

  // Should not be loading after completion
  await waitFor(() => {
    expect(getLoadingState()).toBe(false)
  })

  // Check duration if specified
  if (expectedDuration) {
    const actualDuration = Date.now() - startTime
    expect(actualDuration).toBeGreaterThanOrEqual(expectedDuration - 50)
    expect(actualDuration).toBeLessThanOrEqual(expectedDuration + 200)
  }
}

// Test retry mechanism
export const testRetryMechanism = async (
  operation: () => Promise<any>,
  maxRetries = 3,
  retryDelay = 100
) => {
  let attempts = 0

  const mockOperation = vi.fn().mockImplementation(async () => {
    attempts++
    if (attempts < maxRetries) {
      throw new Error('Operation failed')
    }
    return { success: true }
  })

  // Execute with retries
  for (let i = 0; i < maxRetries; i++) {
    try {
      await mockOperation()
      break
    } catch {
      // Continue to retry
    }

    // Wait before next attempt
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  expect(attempts).toBe(maxRetries)
  expect(mockOperation).toHaveBeenCalledTimes(maxRetries)
}

// Test debounced function
export const testDebouncedFunction = async (
  debouncedFn: Function,
  delay = 300,
  callCount = 5
) => {
  const mockFn = vi.fn()

  // Call function multiple times rapidly
  for (let i = 0; i < callCount; i++) {
    debouncedFn(mockFn)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // Function should not have been called yet
  expect(mockFn).not.toHaveBeenCalled()

  // Wait for debounce delay
  await new Promise(resolve => setTimeout(resolve, delay + 100))

  // Function should have been called once
  expect(mockFn).toHaveBeenCalledTimes(1)
}

// Test throttled function
export const testThrottledFunction = async (
  throttledFn: Function,
  delay = 300,
  callCount = 5
) => {
  const mockFn = vi.fn()

  // Call function multiple times rapidly
  for (let i = 0; i < callCount; i++) {
    throttledFn(mockFn)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // Function should have been called once immediately
  expect(mockFn).toHaveBeenCalledTimes(1)

  // Wait for throttle delay
  await new Promise(resolve => setTimeout(resolve, delay + 100))

  // Function should have been called again
  expect(mockFn).toHaveBeenCalledTimes(2)
}

// Test concurrent operations
export const testConcurrentOperations = async (
  operations: Array<() => Promise<any>>,
  shouldAllSucceed = true
) => {
  const results = await Promise.allSettled(operations.map(operation => operation()))

  if (shouldAllSucceed) {
    results.forEach(result => {
      expect(result.status).toBe('fulfilled')
    })
  }

  return results
}

// Test sequential operations
type AsyncOp = () => Promise<any>
export const testSequentialOperations = async (operations: Array<AsyncOp>) => {
  const results = []

  for (const operation of operations) {
    const result = await operation()
    results.push(result)
  }

  return results
}

// Mock promise with progress
export const mockPromiseWithProgress = <T>(
  data: T,
  totalSteps = 100,
  stepDelay = 10,
  onProgress?: Function
) => vi.fn().mockImplementation(() => new Promise<T>(resolve => {
  let currentStep = 0

  const interval = setInterval(() => {
    currentStep++
    const progressPercent = (currentStep / totalSteps) * 100

    if (onProgress) {
      onProgress(progressPercent)
    }

    if (currentStep >= totalSteps) {
      clearInterval(interval)
      resolve(data)
    }
  }, stepDelay)
}))

// Test with fake timers
export const testWithFakeTimers = async (testFn: () => void | Promise<void>) => {
  vi.useFakeTimers()

  try {
    await testFn()
  } finally {
    vi.useRealTimers()
  }
}

// Advance timers by specific amount
export const advanceTimersByTime = (milliseconds: number) => {
  vi.advanceTimersByTime(milliseconds)
}

// Run all timers
export const runAllTimers = () => {
  vi.runAllTimers()
}

// Test timeout behavior
export const testTimeout = async (
  operation: () => Promise<any>,
  timeout = 1000,
  shouldTimeout = true
) => {
  const timeoutError = new Error('Operation timed out')
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(timeoutError), timeout)
  })

  if (shouldTimeout) {
    const racePromise = Promise.race([operation(), timeoutPromise])
    await expect(racePromise).rejects.toThrow('Operation timed out')
  } else {
    const result = await Promise.race([operation(), timeoutPromise])
    expect(result).toBeDefined()
  }
}

// Test cancellable operation
export const testCancellableOperation = async (createOperation: Function) => {
  const abortController = new AbortController()
  const operation = createOperation(abortController.signal)

  // Cancel operation after a short delay
  setTimeout(() => abortController.abort(), 50)

  await expect(operation).rejects.toThrow()
}

// Mock loading states helper
export const createLoadingStateMock = () => {
  let isLoading = false

  return {
    getLoadingState: () => isLoading,
    setLoadingState: (value: boolean) => {
      isLoading = value
    },
    withLoading: async <T>(operation: () => Promise<T>): Promise<T> => {
      isLoading = true
      try {
        return await operation()
      } finally {
        isLoading = false
      }
    },
  }
}

// Test polling mechanism
export const testPolling = async (
  pollFn: () => Promise<any>,
  interval = 1000,
  maxPolls = 5,
  condition?: Function
) => {
  let pollCount = 0
  let lastResult: any

  while (pollCount < maxPolls) {
    lastResult = await pollFn()
    pollCount++

    if (condition && condition(lastResult)) {
      break
    }

    await new Promise(resolve => setTimeout(resolve, interval))
  }

  expect(pollCount).toBeGreaterThan(0)
  expect(pollCount).toBeLessThanOrEqual(maxPolls)

  return { pollCount, lastResult }
}


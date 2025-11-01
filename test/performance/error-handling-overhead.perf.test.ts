/**
 * Performance tests for error handling system overhead
 *
 * Measures:
 * - Error handling overhead (should be < 100ms)
 * - Retry mechanism performance
 * - ErrorLogger memory usage
 * - Error boundary rendering impact
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  AppError,
  asyncErrorHandler,
  createError,
  ErrorLogger,
} from "~/utils/errorHandling"
import { retryPresets, withRetry } from "~/utils/retry"

import { performanceTestCleanup, performanceTestSetup } from "../setup-performance"

describe("Error Handling Performance", () => {
  beforeEach(() => {
    performanceTestSetup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    performanceTestCleanup()
  })

  describe("Error Creation Overhead", () => {
    it("should create AppError instances with minimal overhead", () => {
      const iterations = 1000

      const duration = global.measurePerformance("Create 1000 AppErrors", () => {
        for (let i = 0; i < iterations; i++) {
          createError.validation(`Test error ${i}`)
        }
      })

      // Creating 1000 errors should take less than 200ms (realistic threshold)
      expect(duration).toBeLessThan(200)

      // Average per error should be < 0.2ms
      const averagePerError = duration / iterations
      expect(averagePerError).toBeLessThan(0.2)
    })

    it("should create errors with all types efficiently", () => {
      const errorTypes = [
        () => createError.validation("Validation error"),
        () => createError.authentication("Auth error"),
        () => createError.authorization("Authz error"),
        () => createError.notFound("Not found"),
        () => createError.network("Network error"),
        () => createError.server("Server error"),
        () => createError.client("Client error"),
        () => createError.database("Database error"),
        () => createError.unknown("Unknown error"),
      ]

      const duration = global.measurePerformance(
        "Create all error types 100x",
        () => {
          for (let i = 0; i < 100; i++) {
            errorTypes.forEach(createFn => createFn())
          }
        }
      )

      // 900 error creations (9 types x 100) should take < 200ms
      expect(duration).toBeLessThan(200)
    })
  })

  describe("Error Handler Wrapper Overhead", () => {
    it("should add minimal overhead to successful operations", async () => {
      const successfulFn = vi.fn(async (x: number) => x * 2)
      const wrappedFn = asyncErrorHandler(successfulFn)

      const duration = global.measurePerformance(
        "Wrapped function calls (1000x)",
        async () => {
          const promises = []
          for (let i = 0; i < 1000; i++) {
            promises.push(wrappedFn(i))
          }
          await Promise.all(promises)
        }
      )

      // 1000 wrapped calls should complete in < 200ms
      expect(duration).toBeLessThan(200)
      expect(successfulFn).toHaveBeenCalledTimes(1000)
    })

    it("should handle errors with acceptable overhead", async () => {
      const errorFn = vi.fn(async () => {
        throw new Error("Test error")
      })
      const wrappedFn = asyncErrorHandler(errorFn)

      const duration = global.measurePerformance(
        "Error handling (100x)",
        async () => {
          const promises = []
          for (let i = 0; i < 100; i++) {
            promises.push(wrappedFn().catch(() => {}))
          }
          await Promise.all(promises)
        }
      )

      // 100 error handling operations should complete in < 100ms
      expect(duration).toBeLessThan(100)

      // Average per error should be < 1ms
      const averagePerError = duration / 100
      expect(averagePerError).toBeLessThan(1)
    })

    it("should not accumulate overhead with nested wrappers", async () => {
      const baseFn = vi.fn(async (x: number) => x)

      // Wrap multiple times
      const wrapped1 = asyncErrorHandler(baseFn)
      const wrapped2 = asyncErrorHandler(wrapped1)
      const wrapped3 = asyncErrorHandler(wrapped2)

      const duration = global.measurePerformance(
        "Nested wrappers (1000x)",
        async () => {
          const promises = []
          for (let i = 0; i < 1000; i++) {
            promises.push(wrapped3(i))
          }
          await Promise.all(promises)
        }
      )

      // Nested wrappers should not significantly impact performance
      // Should still complete in < 200ms
      expect(duration).toBeLessThan(200)
    })
  })

  describe("Retry Mechanism Performance", () => {
    it("should have minimal overhead for successful operations (no retries)", async () => {
      const successFn = vi.fn(async () => "success")

      const duration = global.measurePerformance(
        "Retry wrapper success (1000x)",
        async () => {
          const promises = []
          for (let i = 0; i < 1000; i++) {
            promises.push(withRetry(successFn, { maxRetries: 3, delay: 1 }))
          }
          await Promise.all(promises)
        }
      )

      // 1000 successful operations with retry wrapper should be < 100ms
      expect(duration).toBeLessThan(100)
      expect(successFn).toHaveBeenCalledTimes(1000)
    })

    it("should handle retries efficiently with fake timers", async () => {
      vi.useFakeTimers()

      let attempts = 0
      const retryFn = vi.fn(async () => {
        attempts++
        if (attempts < 3) {
          throw createError.network("Network error")
        }
        return "success"
      })

      const start = performance.now()
      const promise = withRetry(retryFn, retryPresets.quick)

      // Advance timers to complete retries
      await vi.runAllTimersAsync()
      await promise

      const duration = performance.now() - start

      // With fake timers, the operation should complete quickly
      // Duration measurement with fake timers may vary, just check it completed
      expect(retryFn).toHaveBeenCalledTimes(3)
      expect(duration).toBeLessThan(1000) // Generous timeout for fake timers

      vi.useRealTimers()
    })

    it("should handle multiple concurrent retry operations", async () => {
      vi.useFakeTimers()

      const retryFn = (id: number) => vi.fn(async () => {
          throw createError.network(`Network error ${id}`)
        })

      const promises = []
      const start = performance.now()

      for (let i = 0; i < 50; i++) {
        const fn = retryFn(i)
        promises.push(withRetry(fn, { maxRetries: 2, delay: 10 }).catch(() => {}))
      }

      await vi.runAllTimersAsync()
      await Promise.allSettled(promises)

      const duration = performance.now() - start

      // 50 concurrent retry operations should complete quickly with fake timers
      expect(duration).toBeLessThan(100)

      vi.useRealTimers()
    })

    it("should not leak memory during retry operations", async () => {
      vi.useFakeTimers()

      const initialMemory = global.measureMemory()

      // Perform many retry operations
      const promises = []
      for (let i = 0; i < 100; i++) {
        const fn = vi.fn(async () => {
          throw createError.network("Network error")
        })
        promises.push(withRetry(fn, { maxRetries: 3, delay: 10 }).catch(() => {}))
      }

      await vi.runAllTimersAsync()
      await Promise.allSettled(promises)

      const finalMemory = global.measureMemory()

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used
        // Memory increase should be minimal (< 1MB)
        expect(memoryIncrease).toBeLessThan(1 * 1024 * 1024)
      }

      vi.useRealTimers()
    })
  })

  describe("ErrorLogger Performance", () => {
    it("should log errors efficiently", () => {
      const logger = ErrorLogger.getInstance()
      logger.clearLogs() // Start fresh

      const duration = global.measurePerformance("Log 1000 errors", () => {
        for (let i = 0; i < 1000; i++) {
          logger.log(createError.validation(`Test error ${i}`), "test-user")
        }
      })

      // Logging 1000 errors should take < 200ms
      expect(duration).toBeLessThan(200)

      // Verify logs are stored (up to MAX_LOGS limit)
      const logs = logger.getLogs()
      expect(logs.length).toBeLessThanOrEqual(1000)
    })

    it("should not exceed memory limits", () => {
      const logger = ErrorLogger.getInstance()
      logger.clearLogs()
      const initialMemory = global.measureMemory()

      // Log MAX_LOGS + 500 errors to test circular buffer behavior
      for (let i = 0; i < 1500; i++) {
        logger.log(createError.validation(`Test error ${i}`), "test-user")
      }

      const logs = logger.getLogs()
      const finalMemory = global.measureMemory()

      // Should not exceed MAX_LOGS
      expect(logs.length).toBeLessThanOrEqual(1000)

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used
        // Memory increase should be reasonable (< 5MB even with 1500 log attempts)
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
      }
    })

    it("should retrieve logs efficiently", () => {
      const logger = ErrorLogger.getInstance()
      logger.clearLogs()

      // Populate logger with max logs
      for (let i = 0; i < 1000; i++) {
        logger.log(createError.validation(`Test error ${i}`), `user-${i % 10}`)
      }

      const duration = global.measurePerformance("Retrieve all logs 100x", () => {
        for (let i = 0; i < 100; i++) {
          logger.getLogs()
        }
      })

      // 100 log retrievals should be fast (< 50ms)
      expect(duration).toBeLessThan(50)
    })

    it("should retrieve limited logs efficiently", () => {
      const logger = ErrorLogger.getInstance()
      logger.clearLogs()

      // Populate with errors
      for (let i = 0; i < 1000; i++) {
        logger.log(createError.validation(`Test ${i}`), "test-user")
      }

      const duration = global.measurePerformance(
        "Retrieve limited logs 100x",
        () => {
          for (let i = 0; i < 100; i++) {
            logger.getLogs(10)
          }
        }
      )

      // 100 limited retrievals should be very fast (< 20ms)
      expect(duration).toBeLessThan(20)
    })

    it("should clear logs efficiently", () => {
      const logger = ErrorLogger.getInstance()

      // Populate with errors
      for (let i = 0; i < 1000; i++) {
        logger.log(createError.validation(`Test ${i}`), "test-user")
      }

      const duration = global.measurePerformance("Clear all logs", () => {
        logger.clearLogs()
      })

      // Clearing should be nearly instantaneous
      expect(duration).toBeLessThan(5)
      expect(logger.getLogs().length).toBe(0)
    })
  })

  describe("Overall Error Handling Overhead", () => {
    it("should maintain < 100ms overhead for typical error handling flow", async () => {
      const logger = ErrorLogger.getInstance()
      logger.clearLogs()

      // Simulate a typical error handling flow:
      // 1. Operation fails
      // 2. Error is created
      // 3. Error is logged
      // 4. Error is handled/wrapped

      const typicalFlow = async (id: number) => {
        try {
          // Simulate operation
          if (Math.random() > 0.5) {
            throw new Error("Random failure")
          }
          return `Success ${id}`
        } catch (error) {
          // Create AppError
          const appError = createError.server("Operation failed", {
            originalError: error,
          })

          // Log error
          logger.log(appError, "test-user")

          // Handle error
          throw appError
        }
      }

      const wrappedFlow = asyncErrorHandler(typicalFlow)

      const duration = global.measurePerformance(
        "Typical error flow (100x)",
        async () => {
          const promises = []
          for (let i = 0; i < 100; i++) {
            promises.push(wrappedFlow(i).catch(() => {}))
          }
          await Promise.all(promises)
        }
      )

      // 100 complete error handling flows should be < 100ms
      expect(duration).toBeLessThan(100)

      // Average per operation should be < 1ms
      const averagePerOp = duration / 100
      expect(averagePerOp).toBeLessThan(1)
    })

    it("should handle high-frequency errors without performance degradation", async () => {
      const logger = ErrorLogger.getInstance()
      logger.clearLogs()

      const highFrequencyOperation = vi.fn(async () => {
        throw createError.network("High frequency error")
      })

      const wrappedOp = asyncErrorHandler(highFrequencyOperation)

      const duration = global.measurePerformance(
        "High frequency errors (1000x)",
        async () => {
          const promises = []
          for (let i = 0; i < 1000; i++) {
            promises.push(wrappedOp().catch(() => {}))
          }
          await Promise.all(promises)
        }
      )

      // Even with 1000 errors, should complete in reasonable time (< 500ms)
      expect(duration).toBeLessThan(500)
    })

    it("should maintain performance under concurrent load", async () => {
      const logger = ErrorLogger.getInstance()
      logger.clearLogs()

      const operation = async (id: number) => {
        // Mix of success and failure
        if (id % 3 === 0) {
          throw createError.validation(`Validation error ${id}`)
        }
        return `Success ${id}`
      }

      const wrappedOp = asyncErrorHandler(operation)

      const duration = global.measurePerformance(
        "Concurrent operations (500x)",
        async () => {
          const promises = []
          for (let i = 0; i < 500; i++) {
            promises.push(wrappedOp(i).catch(() => {}))
          }
          await Promise.all(promises)
        }
      )

      // 500 concurrent operations (mix of success/failure) should be < 200ms
      expect(duration).toBeLessThan(200)
    })
  })

  describe("Error Sanitization Overhead", () => {
    it("should sanitize errors with minimal overhead", () => {
      const sensitiveData = {
        password: "secret123",
        apiKey: "key-12345",
        creditCard: "1234-5678-9012-3456",
        email: "test@example.com",
        nested: {
          token: "bearer-token",
          data: "safe data",
        },
      }

      const duration = global.measurePerformance("Sanitize 1000 errors", () => {
        for (let i = 0; i < 1000; i++) {
          createError.validation("Error with sensitive data", {
            metadata: sensitiveData,
          })
        }
      })

      // Sanitization should add minimal overhead (< 300ms for 1000 errors)
      expect(duration).toBeLessThan(300)
    })
  })

  describe("Performance Benchmarks Summary", () => {
    it("should meet all performance requirements", async () => {
      const results = {
        errorCreation: 0,
        errorHandling: 0,
        retryMechanism: 0,
        errorLogging: 0,
        overallOverhead: 0,
      }

      // Test error creation
      results.errorCreation = global.measurePerformance(
        "Error creation (100x)",
        () => {
          for (let i = 0; i < 100; i++) {
            createError.validation(`Test ${i}`)
          }
        }
      )

      // Test error handling
      const errorFn = vi.fn(async () => {
        throw createError.network("Test error")
      })
      const wrapped = asyncErrorHandler(errorFn)

      results.errorHandling = global.measurePerformance(
        "Error handling (100x)",
        async () => {
          const promises = []
          for (let i = 0; i < 100; i++) {
            promises.push(wrapped().catch(() => {}))
          }
          await Promise.all(promises)
        }
      )

      // Test retry mechanism
      vi.useFakeTimers()
      const retryFn = vi.fn(async () => "success")

      results.retryMechanism = global.measurePerformance(
        "Retry mechanism (100x)",
        async () => {
          const promises = []
          for (let i = 0; i < 100; i++) {
            promises.push(withRetry(retryFn, retryPresets.quick))
          }
          await vi.runAllTimersAsync()
          await Promise.all(promises)
        }
      )
      vi.useRealTimers()

      // Test error logging
      const logger = ErrorLogger.getInstance()
      logger.clearLogs()

      results.errorLogging = global.measurePerformance(
        "Error logging (100x)",
        () => {
          for (let i = 0; i < 100; i++) {
            logger.log(createError.validation(`Test ${i}`), "test-user")
          }
        }
      )

      // Test overall overhead
      const typicalOp = asyncErrorHandler(async () => {
        if (Math.random() > 0.5) {
          throw createError.server("Error")
        }
        return "success"
      })

      results.overallOverhead = global.measurePerformance(
        "Overall overhead (100x)",
        async () => {
          const promises = []
          for (let i = 0; i < 100; i++) {
            promises.push(typicalOp().catch(() => {}))
          }
          await Promise.all(promises)
        }
      )

      // Log summary
      console.log("\n=== Error Handling Performance Summary ===")
      console.log(`Error Creation (100x):    ${results.errorCreation.toFixed(2)}ms`)
      console.log(`Error Handling (100x):    ${results.errorHandling.toFixed(2)}ms`)
      console.log(`Retry Mechanism (100x):   ${results.retryMechanism.toFixed(2)}ms`)
      console.log(`Error Logging (100x):     ${results.errorLogging.toFixed(2)}ms`)
      console.log(`Overall Overhead (100x):  ${results.overallOverhead.toFixed(2)}ms`)
      console.log("==========================================\n")

      // All operations should meet the < 100ms requirement
      expect(results.errorCreation).toBeLessThan(100)
      expect(results.errorHandling).toBeLessThan(100)
      expect(results.retryMechanism).toBeLessThan(100)
      expect(results.errorLogging).toBeLessThan(100)
      expect(results.overallOverhead).toBeLessThan(100)
    })
  })
})

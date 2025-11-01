/**
 * Integration Tests for Correlation ID + ErrorLogger
 *
 * These tests verify that correlation IDs are properly captured
 * and included in error logs.
 */

/* eslint-disable max-nested-callbacks */

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  generateCorrelationId,
  runWithCorrelationId,
  withCorrelationId,
} from "~/utils/correlationId.server"
import { createError, ErrorHandler, ErrorLogger } from "~/utils/errorHandling"

describe("Correlation ID + ErrorLogger Integration", () => {
  let errorLogger: ErrorLogger

  beforeEach(() => {
    errorLogger = ErrorLogger.getInstance()
    errorLogger.clearLogs()
  })

  afterEach(() => {
    errorLogger.clearLogs()
  })

  describe("Error logging with correlation IDs", () => {
    it("should include correlation ID in error logs", async () => {
      const correlationId = "test_correlation_123"

      await runWithCorrelationId(correlationId, () => {
        const error = createError.server("Test server error")
        errorLogger.log(error)

        const logs = errorLogger.getLogs()
        expect(logs).toHaveLength(1)
        expect(logs[0].correlationId).toBe(correlationId)
      })
    })

    it("should handle missing correlation ID gracefully", () => {
      // Don't set any correlation ID
      const error = createError.validation("Test validation error")
      errorLogger.log(error)

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(1)
      // correlationId should be undefined when not set
      expect(logs[0].correlationId).toBeUndefined()
    })

    it("should include correlation ID with userId", async () => {
      const correlationId = "test_correlation_456"
      const userId = "user_123"

      await runWithCorrelationId(correlationId, () => {
        const error = createError.authentication("Auth failed")
        errorLogger.log(error, userId)

        const logs = errorLogger.getLogs()
        expect(logs).toHaveLength(1)
        expect(logs[0].correlationId).toBe(correlationId)
        expect(logs[0].userId).toBe(userId)
      })
    })

    it("should maintain correlation ID across multiple error logs", async () => {
      const correlationId = "request_correlation_789"

      await runWithCorrelationId(correlationId, () => {
        // Log multiple errors in the same request context
        errorLogger.log(createError.validation("Validation error 1"))
        errorLogger.log(createError.database("Database error"))
        errorLogger.log(createError.network("Network error"))

        const logs = errorLogger.getLogs()
        expect(logs).toHaveLength(3)

        // All errors should have the same correlation ID
        logs.forEach(log => {
          expect(log.correlationId).toBe(correlationId)
        })
      })
    })

    it("should generate unique correlation IDs for different requests", async () => {
      // First request
      const correlationId1 = generateCorrelationId()
      await runWithCorrelationId(correlationId1, () => {
        errorLogger.log(createError.server("Error in request 1"))
      })

      // Second request
      const correlationId2 = generateCorrelationId()
      await runWithCorrelationId(correlationId2, () => {
        errorLogger.log(createError.server("Error in request 2"))
      })

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(2)
      expect(logs[0].correlationId).toBe(correlationId1)
      expect(logs[1].correlationId).toBe(correlationId2)
      expect(logs[0].correlationId).not.toBe(logs[1].correlationId)
    })
  })

  describe("ErrorHandler integration", () => {
    it("should include correlation ID when using ErrorHandler.handle", async () => {
      const correlationId = "handler_correlation_123"

      await runWithCorrelationId(correlationId, () => {
        // ErrorHandler.handle automatically logs errors
        const appError = ErrorHandler.handle(new Error("Test error"), {
          action: "test",
        })

        const logs = errorLogger.getLogs()
        expect(logs).toHaveLength(1)
        expect(logs[0].correlationId).toBe(correlationId)
        expect(logs[0].error).toBe(appError)
      })
    })

    it("should include correlation ID with context and userId", async () => {
      const correlationId = "full_context_456"
      const userId = "user_789"

      await runWithCorrelationId(correlationId, () => {
        ErrorHandler.handle(
          new Error("Database connection failed"),
          { database: "main", query: "SELECT * FROM users" },
          userId
        )

        const logs = errorLogger.getLogs()
        expect(logs).toHaveLength(1)
        expect(logs[0].correlationId).toBe(correlationId)
        expect(logs[0].userId).toBe(userId)
      })
    })
  })

  describe("withCorrelationId wrapper integration", () => {
    it("should automatically capture correlation ID in wrapped functions", async () => {
      const handler = withCorrelationId(async () => {
        // Simulate an error in the handler
        const error = createError.server("Error in wrapped handler")
        errorLogger.log(error)

        return "success"
      })

      await handler()

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].correlationId).toBeDefined()
      expect(logs[0].correlationId).toMatch(/^\d+_[a-z0-9]{9}$/)
    })

    it("should maintain correlation ID through nested operations", async () => {
      const handler = withCorrelationId(async () => {
        // Log error in outer function
        errorLogger.log(createError.validation("Outer error"))

        // Simulate nested async operation
        await new Promise(resolve => setTimeout(resolve, 10))

        // Nested function that also logs errors
        const nestedOperation = async () => {
          await new Promise(resolve => setTimeout(resolve, 5))
          errorLogger.log(createError.database("Nested error"))
        }

        await nestedOperation()
      })

      await handler()

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(2)

      // Both errors should have the same correlation ID
      expect(logs[0].correlationId).toBe(logs[1].correlationId)
      expect(logs[0].correlationId).toBeDefined()
    })

    it("should handle concurrent requests with different correlation IDs", async () => {
      const handler1 = withCorrelationId(async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        errorLogger.log(createError.server("Error in handler 1"))
      })

      const handler2 = withCorrelationId(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        errorLogger.log(createError.server("Error in handler 2"))
      })

      const handler3 = withCorrelationId(async () => {
        await new Promise(resolve => setTimeout(resolve, 15))
        errorLogger.log(createError.server("Error in handler 3"))
      })

      // Run handlers concurrently
      await Promise.all([handler1(), handler2(), handler3()])

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(3)

      // Each error should have a unique correlation ID
      const correlationIds = logs.map(log => log.correlationId)
      const uniqueIds = new Set(correlationIds)
      expect(uniqueIds.size).toBe(3)

      // All IDs should be defined
      correlationIds.forEach(id => {
        expect(id).toBeDefined()
        expect(id).toMatch(/^\d+_[a-z0-9]{9}$/)
      })
    })
  })

  describe("Real-world scenarios", () => {
    it("should trace errors across a simulated request lifecycle", async () => {
      const simulateRequest = withCorrelationId(async (userId: string) => {
        // Step 1: Validate input
        if (!userId) {
          errorLogger.log(createError.validation("User ID required"))
          throw new Error("Validation failed")
        }

        // Step 2: Simulate database query
        await new Promise(resolve => setTimeout(resolve, 10))

        // Step 3: Simulate error in data processing
        try {
          throw new Error("Data processing failed")
        } catch (error) {
          ErrorHandler.handle(error, {
            step: "data-processing",
            userId,
          })
          // ErrorHandler automatically logs, so we should have 1 log
        }

        return "success"
      })

      await simulateRequest("user_123")

      const logs = errorLogger.getLogs()
      expect(logs.length).toBeGreaterThan(0)

      // All errors in this request should have the same correlation ID
      const correlationIds = logs.map(log => log.correlationId)
      const uniqueIds = new Set(correlationIds)
      expect(uniqueIds.size).toBe(1)
    })

    it("should handle multiple sequential requests with different IDs", async () => {
      const simulateRequest = (requestId: string) => withCorrelationId(async () => {
          await new Promise(resolve => setTimeout(resolve, 5))
          errorLogger.log(createError.server(`Error in request ${requestId}`))
          return requestId
        })()

      // Process requests sequentially
      await simulateRequest("req1")
      await simulateRequest("req2")
      await simulateRequest("req3")

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(3)

      // Each request should have a different correlation ID
      const correlationIds = logs.map(log => log.correlationId)
      const uniqueIds = new Set(correlationIds)
      expect(uniqueIds.size).toBe(3)
    })

    it("should maintain correlation ID across error recovery attempts", async () => {
      const handler = withCorrelationId(async () => {
        let attempts = 0

        const attemptOperation = async (): Promise<string> => {
          attempts++

          if (attempts < 3) {
            errorLogger.log(createError.network(`Attempt ${attempts} failed`))
            throw new Error("Operation failed")
          }

          return "success"
        }

        // Retry logic
        let result: string | null = null
        for (let i = 0; i < 3; i++) {
          try {
            result = await attemptOperation()
            break
          } catch {
            continue
          }
        }

        return result
      })

      await handler()

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(2) // Two failed attempts logged

      // All retry attempts should have the same correlation ID
      expect(logs[0].correlationId).toBe(logs[1].correlationId)
      expect(logs[0].correlationId).toBeDefined()
    })
  })

  describe("Edge cases", () => {
    it("should handle errors with very long contexts", async () => {
      const correlationId = "long_context_test"

      await runWithCorrelationId(correlationId, () => {
        const longContext = {
          array: Array(100).fill("item"),
          nested: {
            deeply: {
              nested: {
                object: {
                  with: "many keys",
                },
              },
            },
          },
          longString: "a".repeat(1000),
        }

        errorLogger.log(createError.server("Error with long context", longContext))

        const logs = errorLogger.getLogs()
        expect(logs).toHaveLength(1)
        expect(logs[0].correlationId).toBe(correlationId)
      })
    })

    it("should handle rapid succession of errors", async () => {
      const correlationId = "rapid_fire_test"

      await runWithCorrelationId(correlationId, () => {
        // Log many errors rapidly
        for (let i = 0; i < 50; i++) {
          errorLogger.log(createError.server(`Rapid error ${i}`))
        }

        const logs = errorLogger.getLogs()
        expect(logs).toHaveLength(50)

        // All should have the same correlation ID
        logs.forEach(log => {
          expect(log.correlationId).toBe(correlationId)
        })
      })
    })
  })
})

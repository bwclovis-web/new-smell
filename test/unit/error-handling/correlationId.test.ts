/**
 * Tests for Correlation ID Utilities
 *
 * These tests verify that correlation IDs are properly generated, stored,
 * and retrieved across async operations using AsyncLocalStorage.
 */

import { beforeEach, describe, expect, it } from "vitest"

import {
  generateCorrelationId,
  getCorrelationId,
  setCorrelationId,
  withCorrelationId,
} from "~/utils/correlationId.server"

describe("Correlation ID Utilities", () => {
  describe("generateCorrelationId", () => {
    it("should generate a unique correlation ID", () => {
      const id1 = generateCorrelationId()
      const id2 = generateCorrelationId()

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
    })

    it("should generate IDs in the correct format (timestamp_random)", () => {
      const id = generateCorrelationId()
      const parts = id.split("_")

      expect(parts).toHaveLength(2)
      expect(parts[0]).toMatch(/^\d+$/) // First part is numeric timestamp
      expect(parts[1]).toMatch(/^[a-z0-9]+$/) // Second part is alphanumeric
      expect(parts[1].length).toBe(9) // Random part should be 9 characters
    })

    it("should generate IDs with recent timestamps", () => {
      const beforeTimestamp = Date.now()
      const id = generateCorrelationId()
      const afterTimestamp = Date.now()

      const [timestampPart] = id.split("_")
      const timestamp = parseInt(timestampPart, 10)

      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp)
    })
  })

  describe("setCorrelationId and getCorrelationId", () => {
    beforeEach(() => {
      // Clear any existing correlation ID
      setCorrelationId("")
    })

    it("should store and retrieve a correlation ID", () => {
      const testId = "test_123456789"
      setCorrelationId(testId)

      const retrievedId = getCorrelationId()
      expect(retrievedId).toBe(testId)
    })

    it("should return undefined when no correlation ID is set", () => {
      const retrievedId = getCorrelationId()
      expect(retrievedId).toBeUndefined()
    })

    it("should maintain correlation ID across async operations", async () => {
      const testId = "async_test_123"
      setCorrelationId(testId)

      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 10))

      const retrievedId = getCorrelationId()
      expect(retrievedId).toBe(testId)
    })

    it("should isolate correlation IDs between different contexts", async () => {
      const id1 = "context1_123"
      const id2 = "context2_456"

      // First context
      const promise1 = new Promise<string | undefined>((resolve) => {
        setCorrelationId(id1)
        setTimeout(() => {
          resolve(getCorrelationId())
        }, 20)
      })

      // Second context
      const promise2 = new Promise<string | undefined>((resolve) => {
        setCorrelationId(id2)
        setTimeout(() => {
          resolve(getCorrelationId())
        }, 10)
      })

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Each context should maintain its own correlation ID
      expect(result1).toBe(id1)
      expect(result2).toBe(id2)
    })
  })

  describe("withCorrelationId", () => {
    it("should automatically generate and set a correlation ID", async () => {
      let capturedId: string | undefined

      const handler = withCorrelationId(async () => {
        capturedId = getCorrelationId()
        return "success"
      })

      const result = await handler()

      expect(result).toBe("success")
      expect(capturedId).toBeDefined()
      expect(capturedId).toMatch(/^\d+_[a-z0-9]{9}$/)
    })

    it("should maintain correlation ID throughout async operations", async () => {
      const ids: (string | undefined)[] = []

      const handler = withCorrelationId(async () => {
        ids.push(getCorrelationId())
        await new Promise((resolve) => setTimeout(resolve, 10))
        ids.push(getCorrelationId())
        await new Promise((resolve) => setTimeout(resolve, 10))
        ids.push(getCorrelationId())
      })

      await handler()

      expect(ids).toHaveLength(3)
      expect(ids[0]).toBeDefined()
      expect(ids[0]).toBe(ids[1])
      expect(ids[1]).toBe(ids[2])
    })

    it("should pass through arguments to the wrapped handler", async () => {
      const handler = withCorrelationId(async (a: number, b: string) => `${b}-${a}`)

      const result = await handler(42, "test")
      expect(result).toBe("test-42")
    })

    it("should pass through return values from the wrapped handler", async () => {
      const handler = withCorrelationId(async () => ({
        data: "test",
        count: 5,
      }))

      const result = await handler()
      expect(result).toEqual({ data: "test", count: 5 })
    })

    it("should handle errors from the wrapped handler", async () => {
      const handler = withCorrelationId(async () => {
        throw new Error("Test error")
      })

      await expect(handler()).rejects.toThrow("Test error")
    })

    it("should generate unique IDs for concurrent executions", async () => {
      const ids: (string | undefined)[] = []

      const handler = withCorrelationId(async (index: number) => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 20))
        ids.push(getCorrelationId())
        return index
      })

      // Run multiple handlers concurrently
      await Promise.all([handler(1), handler(2), handler(3), handler(4), handler(5)])

      expect(ids).toHaveLength(5)
      // All IDs should be defined
      ids.forEach((id) => expect(id).toBeDefined())
      // All IDs should be unique
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
    })
  })

  describe("Integration scenarios", () => {
    it("should support nested async operations", async () => {
      const handler = withCorrelationId(async () => {
        const outerCorrelationId = getCorrelationId()

        await new Promise((resolve) => setTimeout(resolve, 10))

        const innerHandler = async () => {
          await new Promise((resolve) => setTimeout(resolve, 5))
          return getCorrelationId()
        }

        const innerCorrelationId = await innerHandler()

        return {
          outer: outerCorrelationId,
          inner: innerCorrelationId,
        }
      })

      const result = await handler()

      expect(result.outer).toBe(result.inner)
      expect(result.outer).toBeDefined()
    })

    it("should work with multiple sequential requests", async () => {
      const results: (string | undefined)[] = []

      // Simulate multiple requests
      for (let i = 0; i < 3; i++) {
        const handler = withCorrelationId(async () => {
          const id = getCorrelationId()
          await new Promise((resolve) => setTimeout(resolve, 5))
          return id
        })

        const id = await handler()
        results.push(id)
      }

      expect(results).toHaveLength(3)
      // All results should be defined
      results.forEach((id) => expect(id).toBeDefined())
      // All results should be unique (different requests)
      const uniqueIds = new Set(results)
      expect(uniqueIds.size).toBe(3)
    })

    it("should allow overriding correlation ID", async () => {
      const customId = "custom_override_123"

      const handler = withCorrelationId(async () => {
        // Override the auto-generated ID
        setCorrelationId(customId)
        return getCorrelationId()
      })

      const result = await handler()
      expect(result).toBe(customId)
    })
  })

  describe("Error handling", () => {
    it("should maintain correlation ID even when errors occur", async () => {
      let errorCorrelationId: string | undefined

      const handler = withCorrelationId(async () => {
        const beforeErrorId = getCorrelationId()

        try {
          throw new Error("Test error")
        } catch (error) {
          errorCorrelationId = getCorrelationId()
        }

        return beforeErrorId
      })

      const beforeErrorId = await handler()

      expect(beforeErrorId).toBe(errorCorrelationId)
      expect(beforeErrorId).toBeDefined()
    })
  })
})

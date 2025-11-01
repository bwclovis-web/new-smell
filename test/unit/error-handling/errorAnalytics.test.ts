/**
 * Tests for Error Analytics Service
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ErrorAnalytics } from "~/utils/errorAnalytics.server"
import type { ErrorLogEntry } from "~/utils/errorHandling"
import { createError, ErrorLogger } from "~/utils/errorHandling"

describe("ErrorAnalytics", () => {
  let analytics: ErrorAnalytics
  let errorLogger: ErrorLogger

  beforeEach(() => {
    analytics = ErrorAnalytics.getInstance()
    errorLogger = ErrorLogger.getInstance()
    errorLogger.clearLogs()
  })

  afterEach(() => {
    errorLogger.clearLogs()
  })

  describe("generateReport", () => {
    it("should generate empty report when no errors", () => {
      const report = analytics.generateReport()

      expect(report.totalErrors).toBe(0)
      expect(report.errorRate).toBe(0)
      expect(report.criticalErrors).toBe(0)
      expect(report.highErrors).toBe(0)
      expect(report.mediumErrors).toBe(0)
      expect(report.lowErrors).toBe(0)
      expect(report.errorsByType).toHaveLength(0)
      expect(report.errorsBySeverity).toHaveLength(0)
      expect(report.affectedUsers).toBe(0)
    })

    it("should count errors by severity", () => {
      // Create errors with different severities
      errorLogger.log(createError.server("Critical error", { severity: "CRITICAL" }))
      errorLogger.log(createError.server("High error", { severity: "HIGH" }))
      errorLogger.log(createError.validation("Medium error", { severity: "MEDIUM" }))
      errorLogger.log(createError.client("Low error", { severity: "LOW" }))

      const report = analytics.generateReport()

      expect(report.totalErrors).toBe(4)
      expect(report.criticalErrors).toBe(1)
      expect(report.highErrors).toBe(1)
      expect(report.mediumErrors).toBe(1)
      expect(report.lowErrors).toBe(1)
    })

    it("should calculate error rate correctly", () => {
      // Create multiple errors
      for (let i = 0; i < 10; i++) {
        errorLogger.log(createError.server(`Error ${i}`))
      }

      const report = analytics.generateReport({ timeRange: "hour" })

      expect(report.errorRate).toBeGreaterThan(0)
      expect(report.totalErrors).toBe(10)
    })

    it("should track affected users", () => {
      // Create errors for different users
      errorLogger.log(createError.server("Error 1"), "user1")
      errorLogger.log(createError.server("Error 2"), "user1")
      errorLogger.log(createError.server("Error 3"), "user2")
      errorLogger.log(createError.server("Error 4"), "user3")

      const report = analytics.generateReport()

      expect(report.affectedUsers).toBe(3)
      expect(report.mostAffectedUsers).toHaveLength(3)
      expect(report.mostAffectedUsers[0].userId).toBe("user1")
      expect(report.mostAffectedUsers[0].errorCount).toBe(2)
    })

    it("should include correlation IDs in report", () => {
      // Create error with correlation ID
      const log: ErrorLogEntry = {
        id: "test-1",
        timestamp: new Date().toISOString(),
        correlationId: "corr-123",
        error: createError.server("Test error").toJSON(),
      }

      // Manually add to logs (bypassing log method for testing)
      ;(errorLogger as any).logs.push(log)

      const report = analytics.generateReport()

      expect(report.recentCorrelationIds).toContain("corr-123")
    })
  })

  describe("getErrorTypeBreakdown", () => {
    it("should categorize errors by type", () => {
      errorLogger.log(createError.database("DB error"))
      errorLogger.log(createError.database("Another DB error"))
      errorLogger.log(createError.validation("Validation error"))
      errorLogger.log(createError.authentication("Auth error"))

      const report = analytics.generateReport()
      const breakdown = report.errorsByType

      expect(breakdown).toHaveLength(3)

      const dbErrors = breakdown.find((b) => b.type === "DATABASE")
      expect(dbErrors?.count).toBe(2)
      expect(dbErrors?.percentage).toBe(50)

      const validationErrors = breakdown.find((b) => b.type === "VALIDATION")
      expect(validationErrors?.count).toBe(1)
      expect(validationErrors?.percentage).toBe(25)
    })

    it("should sort by count descending", () => {
      // Create errors with different frequencies
      errorLogger.log(createError.validation("Validation 1"))
      errorLogger.log(createError.database("DB 1"))
      errorLogger.log(createError.database("DB 2"))
      errorLogger.log(createError.database("DB 3"))

      const report = analytics.generateReport()
      const breakdown = report.errorsByType

      expect(breakdown[0].type).toBe("DATABASE")
      expect(breakdown[0].count).toBe(3)
      expect(breakdown[1].type).toBe("VALIDATION")
      expect(breakdown[1].count).toBe(1)
    })

    it("should track last occurrence", () => {
      const firstTime = new Date("2025-10-31T10:00:00Z")
      const secondTime = new Date("2025-10-31T11:00:00Z")

      // Create first error
      const log1: ErrorLogEntry = {
        id: "test-1",
        timestamp: firstTime.toISOString(),
        error: createError.database("DB error").toJSON(),
      }

      // Create second error of same type
      const log2: ErrorLogEntry = {
        id: "test-2",
        timestamp: secondTime.toISOString(),
        error: createError.database("Another DB error").toJSON(),
      }

      ;(errorLogger as any).logs.push(log1, log2)

      const report = analytics.generateReport()
      const dbBreakdown = report.errorsByType.find((b) => b.type === "DATABASE")

      expect(dbBreakdown?.lastOccurrence).toBe(secondTime.toISOString())
    })
  })

  describe("getErrorSeverityBreakdown", () => {
    it("should categorize errors by severity", () => {
      errorLogger.log(createError.server("Critical 1", { severity: "CRITICAL" }))
      errorLogger.log(createError.server("Critical 2", { severity: "CRITICAL" }))
      errorLogger.log(createError.server("High 1", { severity: "HIGH" }))

      const report = analytics.generateReport()
      const breakdown = report.errorsBySeverity

      const critical = breakdown.find((b) => b.severity === "CRITICAL")
      expect(critical?.count).toBe(2)
      expect(critical?.percentage).toBeCloseTo(66.67, 1)

      const high = breakdown.find((b) => b.severity === "HIGH")
      expect(high?.count).toBe(1)
      expect(high?.percentage).toBeCloseTo(33.33, 1)
    })

    it("should sort by severity order", () => {
      errorLogger.log(createError.server("Low", { severity: "LOW" }))
      errorLogger.log(createError.server("Critical", { severity: "CRITICAL" }))
      errorLogger.log(createError.server("Medium", { severity: "MEDIUM" }))

      const report = analytics.generateReport()
      const breakdown = report.errorsBySeverity

      expect(breakdown[0].severity).toBe("CRITICAL")
      expect(breakdown[1].severity).toBe("MEDIUM")
      expect(breakdown[2].severity).toBe("LOW")
    })
  })

  describe("getTopErrors", () => {
    it("should identify most frequent errors", () => {
      // Create errors with different codes and frequencies
      errorLogger.log(createError.validation("Validation error"))
      errorLogger.log(createError.validation("Another validation error"))
      errorLogger.log(createError.validation("Third validation error"))
      errorLogger.log(createError.database("DB error"))
      errorLogger.log(createError.database("Another DB error"))
      errorLogger.log(createError.authentication("Auth error"))

      const report = analytics.generateReport()
      const topErrors = report.topErrors

      expect(topErrors).toHaveLength(3)
      expect(topErrors[0].code).toBe("VALIDATION_ERROR")
      expect(topErrors[0].count).toBe(3)
      expect(topErrors[1].code).toBe("DATABASE_ERROR")
      expect(topErrors[1].count).toBe(2)
    })

    it("should limit results", () => {
      // Create 15 different error types
      for (let i = 0; i < 15; i++) {
        const error = createError.server(`Error ${i}`)
        error.code = `ERROR_${i}`
        errorLogger.log(error)
      }

      const report = analytics.generateReport()

      // Should be limited to 10 by default
      expect(report.topErrors.length).toBeLessThanOrEqual(10)
    })
  })

  describe("timeRange filtering", () => {
    it("should filter by hour", () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

      // Add old error
      const oldLog: ErrorLogEntry = {
        id: "old",
        timestamp: twoHoursAgo.toISOString(),
        error: createError.server("Old error").toJSON(),
      }

      // Add recent error
      const recentLog: ErrorLogEntry = {
        id: "recent",
        timestamp: thirtyMinutesAgo.toISOString(),
        error: createError.server("Recent error").toJSON(),
      }

      ;(errorLogger as any).logs.push(oldLog, recentLog)

      const report = analytics.generateReport({ timeRange: "hour" })

      expect(report.totalErrors).toBe(1)
    })

    it("should filter by day", () => {
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)

      const oldLog: ErrorLogEntry = {
        id: "old",
        timestamp: twoDaysAgo.toISOString(),
        error: createError.server("Old error").toJSON(),
      }

      const recentLog: ErrorLogEntry = {
        id: "recent",
        timestamp: twelveHoursAgo.toISOString(),
        error: createError.server("Recent error").toJSON(),
      }

      ;(errorLogger as any).logs.push(oldLog, recentLog)

      const report = analytics.generateReport({ timeRange: "day" })

      expect(report.totalErrors).toBe(1)
    })

    it("should support custom date ranges", () => {
      const startDate = new Date("2025-10-01T00:00:00Z")
      const endDate = new Date("2025-10-31T23:59:59Z")

      const withinRange: ErrorLogEntry = {
        id: "within",
        timestamp: new Date("2025-10-15T12:00:00Z").toISOString(),
        error: createError.server("Within range").toJSON(),
      }

      const beforeRange: ErrorLogEntry = {
        id: "before",
        timestamp: new Date("2025-09-30T12:00:00Z").toISOString(),
        error: createError.server("Before range").toJSON(),
      }

      ;(errorLogger as any).logs.push(withinRange, beforeRange)

      const report = analytics.generateReport({ startDate, endDate })

      expect(report.totalErrors).toBe(1)
    })
  })

  describe("trend analysis", () => {
    it("should group errors by hour", () => {
      const now = new Date()

      // Create errors in different hours
      for (let i = 0; i < 3; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
        const log: ErrorLogEntry = {
          id: `test-${i}`,
          timestamp: timestamp.toISOString(),
          error: createError.server(`Error ${i}`).toJSON(),
        }
        ;(errorLogger as any).logs.push(log)
      }

      const report = analytics.generateReport({ timeRange: "day" })

      expect(report.hourlyTrend.length).toBeGreaterThan(0)
      expect(report.hourlyTrend.every((t) => t.totalErrors > 0)).toBe(true)
    })

    it("should group errors by day", () => {
      const now = new Date()

      // Create errors in different days
      for (let i = 0; i < 3; i++) {
        const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const log: ErrorLogEntry = {
          id: `test-${i}`,
          timestamp: timestamp.toISOString(),
          error: createError.server(`Error ${i}`).toJSON(),
        }
        ;(errorLogger as any).logs.push(log)
      }

      const report = analytics.generateReport({ timeRange: "week" })

      expect(report.dailyTrend.length).toBeGreaterThan(0)
    })

    it("should include type and severity breakdown in trends", () => {
      const now = new Date()

      const log1: ErrorLogEntry = {
        id: "test-1",
        timestamp: now.toISOString(),
        error: createError.database("DB error").toJSON(),
      }

      const log2: ErrorLogEntry = {
        id: "test-2",
        timestamp: now.toISOString(),
        error: createError.validation("Validation error").toJSON(),
      }

      ;(errorLogger as any).logs.push(log1, log2)

      const report = analytics.generateReport()
      const latestTrend = report.hourlyTrend[report.hourlyTrend.length - 1]

      expect(latestTrend.errorsByType).toBeDefined()
      expect(latestTrend.errorsBySeverity).toBeDefined()
      expect(latestTrend.totalErrors).toBe(2)
    })
  })

  describe("getErrorRate", () => {
    it("should calculate rate data by hour and severity", () => {
      const now = new Date()

      // Create errors with different severities
      for (let i = 0; i < 3; i++) {
        const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000)
        errorLogger.log(
          createError.server(`Critical ${i}`, { severity: "CRITICAL" })
        )
        errorLogger.log(createError.server(`High ${i}`, { severity: "HIGH" }))
      }

      const rateData = analytics.getErrorRate({ timeRange: "day" })

      expect(rateData.length).toBeGreaterThan(0)
      expect(rateData.every((d) => d.timestamp && d.count > 0)).toBe(true)
    })
  })

  describe("exportData", () => {
    it("should export report as JSON string", () => {
      errorLogger.log(createError.server("Test error"))

      const exported = analytics.exportData()
      const parsed = JSON.parse(exported)

      expect(parsed.totalErrors).toBe(1)
      expect(parsed.errorsByType).toBeDefined()
      expect(parsed.errorsBySeverity).toBeDefined()
    })

    it("should support time range parameter", () => {
      const exported = analytics.exportData({ timeRange: "hour" })
      const parsed = JSON.parse(exported)

      expect(parsed).toBeDefined()
      expect(parsed.startTime).toBeDefined()
      expect(parsed.endTime).toBeDefined()
    })
  })

  describe("clearData", () => {
    it("should clear all analytics data", () => {
      errorLogger.log(createError.server("Test error"))

      let report = analytics.generateReport()
      expect(report.totalErrors).toBe(1)

      analytics.clearData()

      report = analytics.generateReport()
      expect(report.totalErrors).toBe(0)
    })
  })

  describe("edge cases", () => {
    it("should handle errors without user IDs", () => {
      errorLogger.log(createError.server("Error 1"))
      errorLogger.log(createError.server("Error 2"), "user1")

      const report = analytics.generateReport()

      expect(report.affectedUsers).toBe(1)
      expect(report.totalErrors).toBe(2)
    })

    it("should handle errors without correlation IDs", () => {
      errorLogger.log(createError.server("Error without correlation"))

      const report = analytics.generateReport()

      expect(report.recentCorrelationIds).toHaveLength(0)
      expect(report.totalErrors).toBe(1)
    })

    it("should handle empty time periods", () => {
      const report = analytics.generateReport({ timeRange: "hour" })

      expect(report.totalErrors).toBe(0)
      expect(report.hourlyTrend).toBeDefined()
      expect(report.dailyTrend).toBeDefined()
    })

    it("should handle very large datasets efficiently", () => {
      // Create 1000 errors
      for (let i = 0; i < 1000; i++) {
        errorLogger.log(createError.server(`Error ${i}`))
      }

      const startTime = Date.now()
      const report = analytics.generateReport()
      const duration = Date.now() - startTime

      expect(report.totalErrors).toBe(1000)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe("singleton pattern", () => {
    it("should return same instance", () => {
      const instance1 = ErrorAnalytics.getInstance()
      const instance2 = ErrorAnalytics.getInstance()

      expect(instance1).toBe(instance2)
    })
  })
})

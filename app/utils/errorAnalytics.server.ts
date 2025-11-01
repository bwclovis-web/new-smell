/**
 * Error Analytics Service
 *
 * Provides analytics and reporting capabilities for error tracking.
 * Analyzes error logs to provide insights into error patterns, frequency, and trends.
 */

import type { ErrorSeverity, ErrorType } from "./errorHandling"
import { type ErrorLogEntry, ErrorLogger } from "./errorHandling"

export interface ErrorRateData {
  timestamp: string
  count: number
  severity: ErrorSeverity
}

export interface ErrorTypeBreakdown {
  type: ErrorType
  count: number
  percentage: number
  lastOccurrence: string
}

export interface ErrorSeverityBreakdown {
  severity: ErrorSeverity
  count: number
  percentage: number
}

export interface ErrorTrend {
  period: string
  totalErrors: number
  errorsByType: Record<ErrorType, number>
  errorsBySeverity: Record<ErrorSeverity, number>
}

export interface ErrorAnalyticsReport {
  // Overview metrics
  totalErrors: number
  errorRate: number // errors per hour
  criticalErrors: number
  highErrors: number
  mediumErrors: number
  lowErrors: number

  // Breakdowns
  errorsByType: ErrorTypeBreakdown[]
  errorsBySeverity: ErrorSeverityBreakdown[]

  // Trends
  hourlyTrend: ErrorTrend[]
  dailyTrend: ErrorTrend[]

  // Top errors
  topErrors: {
    code: string
    count: number
    message: string
    lastOccurrence: string
  }[]

  // User impact
  affectedUsers: number
  mostAffectedUsers: {
    userId: string
    errorCount: number
  }[]

  // Correlation IDs
  recentCorrelationIds: string[]

  // Time range
  startTime: string
  endTime: string
}

export interface AnalyticsOptions {
  timeRange?: "hour" | "day" | "week" | "month" | "all"
  startDate?: Date
  endDate?: Date
}

export class ErrorAnalytics {
  private static instance: ErrorAnalytics

  private errorLogger: ErrorLogger

  private constructor() {
    this.errorLogger = ErrorLogger.getInstance()
  }

  static getInstance(): ErrorAnalytics {
    if (!ErrorAnalytics.instance) {
      ErrorAnalytics.instance = new ErrorAnalytics()
    }
    return ErrorAnalytics.instance
  }

  /**
   * Generate comprehensive error analytics report
   */
  generateReport(options: AnalyticsOptions = {}): ErrorAnalyticsReport {
    const logs = this.getFilteredLogs(options)
    const now = new Date()
    const startTime = this.getStartTime(options)
    const endTime = options.endDate || now

    return {
      totalErrors: logs.length,
      errorRate: this.calculateErrorRate(logs, startTime, endTime),
      criticalErrors: this.countBySeverity(logs, "CRITICAL"),
      highErrors: this.countBySeverity(logs, "HIGH"),
      mediumErrors: this.countBySeverity(logs, "MEDIUM"),
      lowErrors: this.countBySeverity(logs, "LOW"),
      errorsByType: this.getErrorTypeBreakdown(logs),
      errorsBySeverity: this.getErrorSeverityBreakdown(logs),
      hourlyTrend: this.getHourlyTrend(logs),
      dailyTrend: this.getDailyTrend(logs),
      topErrors: this.getTopErrors(logs),
      affectedUsers: this.countAffectedUsers(logs),
      mostAffectedUsers: this.getMostAffectedUsers(logs),
      recentCorrelationIds: this.getRecentCorrelationIds(logs),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    }
  }

  /**
   * Get error rate over time
   */
  getErrorRate(options: AnalyticsOptions = {}): ErrorRateData[] {
    const logs = this.getFilteredLogs(options)
    const rateData: ErrorRateData[] = []

    // Group by hour
    const hourlyGroups = this.groupByHour(logs)

    Object.entries(hourlyGroups).forEach(([hour, entries]) => {
      const severityCounts = {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      }

      entries.forEach((entry) => {
        severityCounts[entry.error.severity]++
      })

      Object.entries(severityCounts).forEach(([severity, count]) => {
        if (count > 0) {
          rateData.push({
            timestamp: hour,
            count,
            severity: severity as ErrorSeverity,
          })
        }
      })
    })

    return rateData.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }

  /**
   * Get breakdown of errors by type
   */
  getErrorTypeBreakdown(logs: ErrorLogEntry[]): ErrorTypeBreakdown[] {
    const typeCounts = new Map<ErrorType, number>()
    const lastOccurrence = new Map<ErrorType, string>()

    logs.forEach((log) => {
      const type = log.error.type
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1)

      // Update last occurrence
      const current = lastOccurrence.get(type)
      if (!current || log.timestamp > current) {
        lastOccurrence.set(type, log.timestamp)
      }
    })

    const total = logs.length
    const breakdown: ErrorTypeBreakdown[] = []

    typeCounts.forEach((count, type) => {
      breakdown.push({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        lastOccurrence: lastOccurrence.get(type) || "",
      })
    })

    return breakdown.sort((a, b) => b.count - a.count)
  }

  /**
   * Get breakdown of errors by severity
   */
  getErrorSeverityBreakdown(logs: ErrorLogEntry[]): ErrorSeverityBreakdown[] {
    const severityCounts = new Map<ErrorSeverity, number>()

    logs.forEach((log) => {
      const severity = log.error.severity
      severityCounts.set(severity, (severityCounts.get(severity) || 0) + 1)
    })

    const total = logs.length
    const breakdown: ErrorSeverityBreakdown[] = []

    severityCounts.forEach((count, severity) => {
      breakdown.push({
        severity,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      })
    })

    // Sort by severity level
    const severityOrder: ErrorSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    return breakdown.sort(
      (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
    )
  }

  /**
   * Get hourly error trend
   */
  private getHourlyTrend(logs: ErrorLogEntry[]): ErrorTrend[] {
    const hourlyGroups = this.groupByHour(logs)
    const trends: ErrorTrend[] = []

    Object.entries(hourlyGroups).forEach(([hour, entries]) => {
      trends.push(this.createTrend(hour, entries))
    })

    return trends.sort(
      (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
    )
  }

  /**
   * Get daily error trend
   */
  private getDailyTrend(logs: ErrorLogEntry[]): ErrorTrend[] {
    const dailyGroups = this.groupByDay(logs)
    const trends: ErrorTrend[] = []

    Object.entries(dailyGroups).forEach(([day, entries]) => {
      trends.push(this.createTrend(day, entries))
    })

    return trends.sort(
      (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
    )
  }

  /**
   * Get top errors by frequency
   */
  private getTopErrors(logs: ErrorLogEntry[], limit: number = 10) {
    const errorCounts = new Map<
      string,
      {
        count: number
        message: string
        lastOccurrence: string
      }
    >()

    logs.forEach((log) => {
      const code = log.error.code
      const existing = errorCounts.get(code)

      if (existing) {
        existing.count++
        if (log.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = log.timestamp
        }
      } else {
        errorCounts.set(code, {
          count: 1,
          message: log.error.userMessage,
          lastOccurrence: log.timestamp,
        })
      }
    })

    return Array.from(errorCounts.entries())
      .map(([code, data]) => ({
        code,
        count: data.count,
        message: data.message,
        lastOccurrence: data.lastOccurrence,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Count unique affected users
   */
  private countAffectedUsers(logs: ErrorLogEntry[]): number {
    const users = new Set<string>()

    logs.forEach((log) => {
      if (log.userId) {
        users.add(log.userId)
      }
    })

    return users.size
  }

  /**
   * Get most affected users
   */
  private getMostAffectedUsers(logs: ErrorLogEntry[], limit: number = 10) {
    const userCounts = new Map<string, number>()

    logs.forEach((log) => {
      if (log.userId) {
        userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1)
      }
    })

    return Array.from(userCounts.entries())
      .map(([userId, errorCount]) => ({ userId, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, limit)
  }

  /**
   * Get recent correlation IDs
   */
  private getRecentCorrelationIds(
    logs: ErrorLogEntry[],
    limit: number = 10
  ): string[] {
    return logs
      .filter((log) => log.correlationId)
      .map((log) => log.correlationId!)
      .slice(-limit)
      .reverse()
  }

  /**
   * Calculate error rate (errors per hour)
   */
  private calculateErrorRate(
    logs: ErrorLogEntry[],
    startTime: Date,
    endTime: Date
  ): number {
    if (logs.length === 0) {
      return 0
    }

    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    return durationHours > 0 ? logs.length / durationHours : 0
  }

  /**
   * Count errors by severity
   */
  private countBySeverity(logs: ErrorLogEntry[], severity: ErrorSeverity): number {
    return logs.filter((log) => log.error.severity === severity).length
  }

  /**
   * Get filtered logs based on options
   */
  private getFilteredLogs(options: AnalyticsOptions): ErrorLogEntry[] {
    const allLogs = this.errorLogger.getLogs()
    const startTime = this.getStartTime(options)
    const endTime = options.endDate || new Date()

    return allLogs.filter((log) => {
      const logTime = new Date(log.timestamp)
      return logTime >= startTime && logTime <= endTime
    })
  }

  /**
   * Get start time based on options
   */
  private getStartTime(options: AnalyticsOptions): Date {
    if (options.startDate) {
      return options.startDate
    }

    const now = new Date()

    switch (options.timeRange) {
      case "hour":
        return new Date(now.getTime() - 60 * 60 * 1000)
      case "day":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case "month":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case "all":
      default:
        // Start from first log or 30 days ago
        const logs = this.errorLogger.getLogs()
        if (logs.length > 0) {
          return new Date(logs[0].timestamp)
        }
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Group logs by hour
   */
  private groupByHour(logs: ErrorLogEntry[]): Record<string, ErrorLogEntry[]> {
    const groups: Record<string, ErrorLogEntry[]> = {}

    logs.forEach((log) => {
      const date = new Date(log.timestamp)
      const hourKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        0,
        0,
        0
      ).toISOString()

      if (!groups[hourKey]) {
        groups[hourKey] = []
      }
      groups[hourKey].push(log)
    })

    return groups
  }

  /**
   * Group logs by day
   */
  private groupByDay(logs: ErrorLogEntry[]): Record<string, ErrorLogEntry[]> {
    const groups: Record<string, ErrorLogEntry[]> = {}

    logs.forEach((log) => {
      const date = new Date(log.timestamp)
      const dayKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0
      ).toISOString()

      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(log)
    })

    return groups
  }

  /**
   * Create trend data for a time period
   */
  private createTrend(period: string, entries: ErrorLogEntry[]): ErrorTrend {
    const errorsByType: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}

    entries.forEach((entry) => {
      const type = entry.error.type
      const severity = entry.error.severity

      errorsByType[type] = (errorsByType[type] || 0) + 1
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1
    })

    return {
      period,
      totalErrors: entries.length,
      errorsByType: errorsByType as Record<ErrorType, number>,
      errorsBySeverity: errorsBySeverity as Record<ErrorSeverity, number>,
    }
  }

  /**
   * Export analytics data as JSON
   */
  exportData(options: AnalyticsOptions = {}): string {
    const report = this.generateReport(options)
    return JSON.stringify(report, null, 2)
  }

  /**
   * Clear analytics data (for testing)
   */
  clearData(): void {
    this.errorLogger.clearLogs()
  }
}

// Export singleton instance
export const errorAnalytics = ErrorAnalytics.getInstance()

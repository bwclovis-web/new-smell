// Security audit logging system

const auditLogs = new Map()

/**
 * Audit log levels
 */
export const AUDIT_LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  CRITICAL: "critical",
}

/**
 * Audit log categories
 */
export const AUDIT_CATEGORIES = {
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  DATA_ACCESS: "data_access",
  CONFIGURATION: "configuration",
  SECURITY: "security",
  PERFORMANCE: "performance",
  SYSTEM: "system",
}

/**
 * Log audit event
 */
export function logAuditEvent(event) {
  const {
    level = AUDIT_LEVELS.INFO,
    category = AUDIT_CATEGORIES.SYSTEM,
    action,
    userId = null,
    ipAddress = null,
    userAgent = null,
    resource = null,
    details = {},
    outcome = "success",
  } = event

  const auditLog = {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    action,
    userId,
    ipAddress,
    userAgent,
    resource,
    details,
    outcome,
  }

  // Store audit log
  const key = `${category}-${level}`
  const logs = auditLogs.get(key) || []
  logs.push(auditLog)

  // Keep only last 1000 logs per category/level
  if (logs.length > 1000) {
    logs.shift()
  }
  auditLogs.set(key, logs)

  // Log to console with appropriate level
  const logMessage = formatAuditLog(auditLog)
  switch (level) {
    case AUDIT_LEVELS.CRITICAL:
    case AUDIT_LEVELS.ERROR:
      console.error(logMessage)
      break
    case AUDIT_LEVELS.WARN:
      console.warn(logMessage)
      break
    default:
      console.log(logMessage)
  }

  return auditLog
}

/**
 * Format audit log for console output
 */
function formatAuditLog(log) {
  const { timestamp, level, category, action, userId, ipAddress, outcome } = log

  let emoji = "📝"
  if (level === AUDIT_LEVELS.CRITICAL) {
    emoji = "🚨"
  } else if (level === AUDIT_LEVELS.ERROR) {
    emoji = "❌"
  } else if (level === AUDIT_LEVELS.WARN) {
    emoji = "⚠️"
  }

  return `${emoji} [${timestamp}] ${level.toUpperCase()} ${category.toUpperCase()}: ${action} (${outcome}) ${
    userId ? `[User: ${userId}]` : ""
  } ${ipAddress ? `[IP: ${ipAddress}]` : ""}`
}

/**
 * Get audit logs
 */
export function getAuditLogs(filters = {}) {
  const {
    category = null,
    level = null,
    userId = null,
    ipAddress = null,
    startDate = null,
    endDate = null,
    limit = 100,
  } = filters

  let allLogs = []

  // Collect logs from all categories/levels
  for (const logs of auditLogs.values()) {
    allLogs.push(...logs)
  }

  // Apply filters
  let filteredLogs = allLogs

  if (category) {
    filteredLogs = filteredLogs.filter(log => log.category === category)
  }

  if (level) {
    filteredLogs = filteredLogs.filter(log => log.level === level)
  }

  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === userId)
  }

  if (ipAddress) {
    filteredLogs = filteredLogs.filter(log => log.ipAddress === ipAddress)
  }

  if (startDate) {
    const start = new Date(startDate)
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start)
  }

  if (endDate) {
    const end = new Date(endDate)
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end)
  }

  // Sort by timestamp (newest first) and limit
  return filteredLogs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

/**
 * Get audit statistics
 */
export function getAuditStats() {
  const stats = {
    totalLogs: 0,
    logsByLevel: {},
    logsByCategory: {},
    logsByOutcome: {},
    recentLogs: [],
    uniqueUsers: new Set(),
    uniqueIPs: new Set(),
  }

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  for (const logs of auditLogs.values()) {
    stats.totalLogs += logs.length

    logs.forEach(log => {
      // Count by level
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1

      // Count by category
      stats.logsByCategory[log.category] =
        (stats.logsByCategory[log.category] || 0) + 1

      // Count by outcome
      stats.logsByOutcome[log.outcome] = (stats.logsByOutcome[log.outcome] || 0) + 1

      // Track unique users and IPs
      if (log.userId) {
        stats.uniqueUsers.add(log.userId)
      }
      if (log.ipAddress) {
        stats.uniqueIPs.add(log.ipAddress)
      }

      // Get recent logs
      if (new Date(log.timestamp) > oneHourAgo) {
        stats.recentLogs.push(log)
      }
    })
  }

  stats.uniqueUsers = stats.uniqueUsers.size
  stats.uniqueIPs = stats.uniqueIPs.size
  stats.recentLogs = stats.recentLogs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50)

  return stats
}

/**
 * Generate unique audit ID
 */
function generateAuditId() {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Cleanup old audit logs
 */
export function cleanupAuditLogs() {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  for (const [key, logs] of auditLogs) {
    const recentLogs = logs.filter(log => new Date(log.timestamp) > oneWeekAgo)

    if (recentLogs.length === 0) {
      auditLogs.delete(key)
    } else {
      auditLogs.set(key, recentLogs)
    }
  }
}

// Cleanup old audit logs daily
setInterval(cleanupAuditLogs, 24 * 60 * 60 * 1000)

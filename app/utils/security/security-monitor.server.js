// Comprehensive security monitoring and alerting system

const securityEvents = new Map()
const securityAlerts = new Set()
const suspiciousActivities = new Map()

/**
 * Security event types
 */
export const SECURITY_EVENT_TYPES = {
  AUTH_FAILURE: "AUTH_FAILURE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  CSRF_VIOLATION: "CSRF_VIOLATION",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  IP_BLOCKED: "IP_BLOCKED",
  INVALID_TOKEN: "INVALID_TOKEN",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  SQL_INJECTION_ATTEMPT: "SQL_INJECTION_ATTEMPT",
  XSS_ATTEMPT: "XSS_ATTEMPT",
  BRUTE_FORCE_ATTEMPT: "BRUTE_FORCE_ATTEMPT",
  DATA_BREACH_ATTEMPT: "DATA_BREACH_ATTEMPT",
}

/**
 * Log security events
 */
export function logSecurityEvent(event) {
  const {
    type,
    userId = null,
    ipAddress = null,
    userAgent = null,
    path = null,
    method = null,
    details = {},
    severity = "medium",
  } = event

  const securityEvent = {
    id: generateEventId(),
    type,
    userId,
    ipAddress,
    userAgent,
    path,
    method,
    details,
    severity,
    timestamp: new Date().toISOString(),
  }

  // Store event
  const key = `${ipAddress}-${type}`
  const events = securityEvents.get(key) || []
  events.push(securityEvent)

  // Keep only last 50 events per IP/type
  if (events.length > 50) {
    events.shift()
  }
  securityEvents.set(key, events)

  // Check for patterns and alert
  analyzeSecurityEvent(securityEvent)

  // Log to console (in production, send to monitoring service)
  console.warn(`🚨 Security Event [${severity.toUpperCase()}]:`, {
    type,
    ip: ipAddress,
    path,
    timestamp: securityEvent.timestamp,
  })

  return securityEvent
}

/**
 * Analyze security events for patterns
 */
function analyzeSecurityEvent(event) {
  const { type, ipAddress, userId, path } = event

  // Track suspicious activities
  const suspiciousKey = `${ipAddress}-suspicious`
  const activities = suspiciousActivities.get(suspiciousKey) || []

  activities.push({
    type,
    path,
    timestamp: event.timestamp,
  })

  // Keep only last 20 activities per IP
  if (activities.length > 20) {
    activities.shift()
  }
  suspiciousActivities.set(suspiciousKey, activities)

  // Check for brute force attempts
  if (type === SECURITY_EVENT_TYPES.AUTH_FAILURE) {
    checkBruteForceAttempt(ipAddress, activities)
  }

  // Check for suspicious patterns
  checkSuspiciousPatterns(ipAddress, activities)

  // Check for data breach attempts
  checkDataBreachAttempts(ipAddress, activities)
}

/**
 * Check for brute force attempts
 */
function checkBruteForceAttempt(ipAddress, activities) {
  const now = new Date()
  const recentAuthFailures = activities.filter((activity) => {
    const activityTime = new Date(activity.timestamp)
    return (
      activity.type === SECURITY_EVENT_TYPES.AUTH_FAILURE &&
      now - activityTime < 15 * 60 * 1000
    ) // Last 15 minutes
  })

  if (recentAuthFailures.length >= 5) {
    const alertKey = `${ipAddress}-brute-force`
    if (!securityAlerts.has(alertKey)) {
      securityAlerts.add(alertKey)

      logSecurityEvent({
        type: SECURITY_EVENT_TYPES.BRUTE_FORCE_ATTEMPT,
        ipAddress,
        details: {
          failureCount: recentAuthFailures.length,
          timeWindow: "15 minutes",
        },
        severity: "high",
      })
    }
  }
}

/**
 * Check for suspicious patterns
 */
function checkSuspiciousPatterns(ipAddress, activities) {
  const now = new Date()
  const recentActivities = activities.filter((activity) => {
    const activityTime = new Date(activity.timestamp)
    return now - activityTime < 60 * 60 * 1000 // Last hour
  })

  // Check for rapid-fire requests
  const rapidRequests = recentActivities.filter((activity) => {
    const activityTime = new Date(activity.timestamp)
    return now - activityTime < 60 * 1000 // Last minute
  })

  if (rapidRequests.length >= 20) {
    const alertKey = `${ipAddress}-rapid-requests`
    if (!securityAlerts.has(alertKey)) {
      securityAlerts.add(alertKey)

      logSecurityEvent({
        type: SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        ipAddress,
        details: {
          activityType: "rapid_requests",
          requestCount: rapidRequests.length,
          timeWindow: "1 minute",
        },
        severity: "medium",
      })
    }
  }

  // Check for scanning behavior
  const uniquePaths = new Set(recentActivities.map((a) => a.path))
  if (uniquePaths.size >= 10) {
    const alertKey = `${ipAddress}-scanning`
    if (!securityAlerts.has(alertKey)) {
      securityAlerts.add(alertKey)

      logSecurityEvent({
        type: SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        ipAddress,
        details: {
          activityType: "path_scanning",
          uniquePaths: uniquePaths.size,
          timeWindow: "1 hour",
        },
        severity: "medium",
      })
    }
  }
}

/**
 * Check for data breach attempts
 */
function checkDataBreachAttempts(ipAddress, activities) {
  const sensitivePaths = ["/admin", "/api/users", "/api/auth", "/api/ratings"]
  const recentSensitiveAccess = activities.filter((activity) => {
    const activityTime = new Date(activity.timestamp)
    return (
      sensitivePaths.some((path) => activity.path.startsWith(path)) &&
      new Date() - activityTime < 30 * 60 * 1000
    ) // Last 30 minutes
  })

  if (recentSensitiveAccess.length >= 5) {
    const alertKey = `${ipAddress}-data-breach`
    if (!securityAlerts.has(alertKey)) {
      securityAlerts.add(alertKey)

      logSecurityEvent({
        type: SECURITY_EVENT_TYPES.DATA_BREACH_ATTEMPT,
        ipAddress,
        details: {
          sensitiveAccessCount: recentSensitiveAccess.length,
          timeWindow: "30 minutes",
        },
        severity: "high",
      })
    }
  }
}

/**
 * Get security statistics
 */
export function getSecurityStats() {
  // In serverless environments, the in-memory storage might be empty
  // This is normal and expected behavior
  const stats = {
    totalEvents: 0,
    eventsByType: {},
    eventsBySeverity: {},
    uniqueIPs: new Set(),
    recentEvents: [],
    activeAlerts: securityAlerts ? securityAlerts.size : 0,
    suspiciousIPs: suspiciousActivities ? suspiciousActivities.size : 0,
    serverlessMode: false,
  }

  // Check if we're in a serverless environment where storage might be empty
  if (!securityEvents || securityEvents.size === 0) {
    stats.serverlessMode = true
    stats.message =
      "Security monitoring is running in serverless mode. Data resets between function invocations."
    return stats
  }

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  for (const [key, events] of securityEvents) {
    const [ip] = key.split("-")
    stats.uniqueIPs.add(ip)
    stats.totalEvents += events.length

    events.forEach((event) => {
      // Count by type
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1

      // Count by severity
      stats.eventsBySeverity[event.severity] =
        (stats.eventsBySeverity[event.severity] || 0) + 1

      // Get recent events
      if (new Date(event.timestamp) > oneHourAgo) {
        stats.recentEvents.push(event)
      }
    })
  }

  stats.uniqueIPs = stats.uniqueIPs.size
  stats.recentEvents = stats.recentEvents
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50) // Last 50 events

  return stats
}

/**
 * Get events for a specific IP
 */
export function getEventsForIP(ipAddress) {
  const events = []

  for (const [key, ipEvents] of securityEvents) {
    if (key.startsWith(`${ipAddress}-`)) {
      events.push(...ipEvents)
    }
  }

  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

/**
 * Clear old events (call periodically)
 */
export function cleanupOldEvents() {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  for (const [key, events] of securityEvents) {
    const recentEvents = events.filter(
      (event) => new Date(event.timestamp) > oneDayAgo
    )

    if (recentEvents.length === 0) {
      securityEvents.delete(key)
    } else {
      securityEvents.set(key, recentEvents)
    }
  }

  // Clear old alerts
  securityAlerts.clear()
}

/**
 * Generate unique event ID
 */
function generateEventId() {
  return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Cleanup old events every hour
setInterval(cleanupOldEvents, 60 * 60 * 1000)

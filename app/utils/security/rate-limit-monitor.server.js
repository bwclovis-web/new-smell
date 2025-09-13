// Rate limiting monitoring and alerting utilities

const rateLimitViolations = new Map()
const rateLimitAlerts = new Set()

/**
 * Track rate limit violations for monitoring
 */
export function trackRateLimitViolation(ip, path, limitType) {
  const key = `${ip}-${path}`
  const violations = rateLimitViolations.get(key) || []
  
  violations.push({
    timestamp: new Date().toISOString(),
    path,
    limitType,
    ip
  })
  
  // Keep only last 10 violations per IP/path combination
  if (violations.length > 10) {
    violations.shift()
  }
  
  rateLimitViolations.set(key, violations)
  
  // Check if we should alert
  checkForRateLimitAbuse(ip, path, violations)
}

/**
 * Check for potential rate limit abuse
 */
function checkForRateLimitAbuse(ip, path, violations) {
  const now = new Date()
  const recentViolations = violations.filter(v => {
    const violationTime = new Date(v.timestamp)
    return (now - violationTime) < 5 * 60 * 1000 // Last 5 minutes
  })
  
  if (recentViolations.length >= 5) {
    const alertKey = `${ip}-abuse`
    if (!rateLimitAlerts.has(alertKey)) {
      rateLimitAlerts.add(alertKey)
      console.warn(`🚨 Rate limit abuse detected:`, {
        ip,
        path,
        violations: recentViolations.length,
        timestamp: now.toISOString()
      })
      
      // In production, you might want to:
      // - Send to monitoring service (Sentry, DataDog, etc.)
      // - Block the IP temporarily
      // - Send alert to security team
    }
  }
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats() {
  const stats = {
    totalViolations: 0,
    uniqueIPs: new Set(),
    violationsByPath: {},
    recentViolations: []
  }
  
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  for (const [key, violations] of rateLimitViolations) {
    const [ip] = key.split('-')
    stats.uniqueIPs.add(ip)
    stats.totalViolations += violations.length
    
    // Count violations by path
    violations.forEach(violation => {
      const path = violation.path
      stats.violationsByPath[path] = (stats.violationsByPath[path] || 0) + 1
    })
    
    // Get recent violations (last hour)
    const recent = violations.filter(v => new Date(v.timestamp) > oneHourAgo)
    stats.recentViolations.push(...recent)
  }
  
  stats.uniqueIPs = stats.uniqueIPs.size
  stats.recentViolations = stats.recentViolations.slice(-50) // Last 50 violations
  
  return stats
}

/**
 * Clear old violations (call this periodically)
 */
export function cleanupOldViolations() {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  for (const [key, violations] of rateLimitViolations) {
    const recentViolations = violations.filter(v => new Date(v.timestamp) > oneDayAgo)
    
    if (recentViolations.length === 0) {
      rateLimitViolations.delete(key)
    } else {
      rateLimitViolations.set(key, recentViolations)
    }
  }
  
  // Clear old alerts
  rateLimitAlerts.clear()
}

/**
 * Check if IP should be temporarily blocked
 */
export function shouldBlockIP(ip) {
  const violations = Array.from(rateLimitViolations.values())
    .flat()
    .filter(v => v.ip === ip)
  
  const now = new Date()
  const recentViolations = violations.filter(v => {
    const violationTime = new Date(v.timestamp)
    return (now - violationTime) < 15 * 60 * 1000 // Last 15 minutes
  })
  
  return recentViolations.length >= 10 // Block if 10+ violations in 15 minutes
}

// Cleanup old violations every hour
setInterval(cleanupOldViolations, 60 * 60 * 1000)

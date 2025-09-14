// TypeScript declarations for security-monitor.server.js

export interface SecurityEvent {
  id: string
  type: string
  userId: string | null
  ipAddress: string | null
  userAgent: string | null
  path: string | null
  method: string | null
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
}

export interface SecurityStats {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  uniqueIPs: number
  recentEvents: SecurityEvent[]
  activeAlerts: number
  suspiciousIPs: number
  serverlessMode?: boolean
  message?: string
}

export const SECURITY_EVENT_TYPES: {
  AUTH_FAILURE: 'AUTH_FAILURE'
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
  CSRF_VIOLATION: 'CSRF_VIOLATION'
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
  IP_BLOCKED: 'IP_BLOCKED'
  INVALID_TOKEN: 'INVALID_TOKEN'
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT'
  XSS_ATTEMPT: 'XSS_ATTEMPT'
  BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT'
  DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT'
}

export function logSecurityEvent(event: {
  type: string
  userId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  path?: string | null
  method?: string | null
  details?: Record<string, any>
  severity?: 'low' | 'medium' | 'high' | 'critical'
}): SecurityEvent

export function getSecurityStats(): SecurityStats

export function getEventsForIP(ipAddress: string): SecurityEvent[]

export function cleanupOldEvents(): void

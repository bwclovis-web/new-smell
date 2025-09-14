import { json } from 'react-router'

import { getSecurityStats } from '~/utils/security/security-monitor.server'

export const ROUTE_PATH = '/admin/security-stats' as const

export const loader = async ({ request }: { request: Request }) => {
  try {
    const stats = getSecurityStats()

    return json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get security stats:', error)

    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        uniqueIPs: 0,
        recentEvents: [],
        activeAlerts: 0,
        suspiciousIPs: 0
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

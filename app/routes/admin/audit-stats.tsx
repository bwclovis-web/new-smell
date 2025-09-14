import { json } from 'react-router'

import { getAuditStats } from '~/utils/security/audit-logger.server'

export const ROUTE_PATH = '/admin/audit-stats' as const

export const loader = async ({ request }: { request: Request }) => {
  try {
    const stats = getAuditStats()
    
    return json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get audit stats:', error)
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        totalLogs: 0,
        logsByLevel: {},
        logsByCategory: {},
        logsByOutcome: {},
        recentLogs: [],
        uniqueUsers: 0,
        uniqueIPs: 0
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

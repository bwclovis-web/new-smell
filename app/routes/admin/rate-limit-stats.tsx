import { json } from 'react-router'

import { getRateLimitStats } from '~/utils/security/rate-limit-monitor.server'

export const ROUTE_PATH = '/admin/rate-limit-stats' as const

export const loader = async ({ request }: { request: Request }) => {
  try {
    const stats = getRateLimitStats()
    
    return json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get rate limit stats:', error)
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        totalViolations: 0,
        uniqueIPs: 0,
        violationsByPath: {},
        recentViolations: []
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

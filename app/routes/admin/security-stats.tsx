import { getSecurityStats } from '~/utils/security/security-monitor.server'

export const ROUTE_PATH = '/admin/security-stats' as const

export const loader = async () => {
  try {
    // Check if getSecurityStats function exists
    if (typeof getSecurityStats !== 'function') {
      throw new Error('getSecurityStats function is not available')
    }

    const stats = getSecurityStats()

    // Validate the stats object structure
    if (!stats || typeof stats !== 'object') {
      throw new Error('Invalid security stats data structure')
    }

    return Response.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // Log error details for debugging
    // (in production, this would go to a logging service)
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    }

    // In production, replace console.error with proper logging service
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Failed to get security stats:', error)
      // eslint-disable-next-line no-console
      console.error('Error details:', errorDetails)
    }

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
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

import { getRateLimitStats } from '~/utils/security/rate-limit-monitor.server'

export const ROUTE_PATH = '/admin/rate-limit-stats' as const

export const loader = async () => {
  try {
    const stats = getRateLimitStats()

    return Response.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // Log error details for debugging (in production, this would go to a logging service)
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    }

    // In production, replace console.error with proper logging service
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get rate limit stats:', error)
      console.error('Error details:', errorDetails)
    }

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
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

import { getRateLimitStats } from '~/utils/security/rate-limit-monitor.server'
import { ServerErrorHandler } from '~/utils/errorHandling.server'

export const ROUTE_PATH = '/admin/rate-limit-stats' as const

export const loader = async () => {
  try {
    const stats = getRateLimitStats()

    return ServerErrorHandler.createSuccessResponse({
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const appError = ServerErrorHandler.handle(error, {
      api: 'rate-limit-stats',
      operation: 'getRateLimitStats'
    })

    return ServerErrorHandler.createErrorResponse(appError)
  }
}

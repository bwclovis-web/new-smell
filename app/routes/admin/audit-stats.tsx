import { getAuditStats } from '~/utils/security/audit-logger.server'
import { ServerErrorHandler } from '~/utils/errorHandling.server'

export const ROUTE_PATH = '/admin/audit-stats' as const

export const loader = async () => {
  try {
    const stats = getAuditStats()

    return ServerErrorHandler.createSuccessResponse({
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const appError = ServerErrorHandler.handle(error, {
      api: 'audit-stats',
      operation: 'getAuditStats'
    })

    return ServerErrorHandler.createErrorResponse(appError)
  }
}

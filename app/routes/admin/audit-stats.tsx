import { ServerErrorHandler } from "~/utils/errorHandling.server"
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { getAuditStats } from "~/utils/security/audit-logger.server"
import { requireAdmin } from "~/utils/requireAdmin.server"

export const ROUTE_PATH = "/admin/audit-stats" as const

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    await requireAdmin(request)
  try {
    const stats = getAuditStats()

    return ServerErrorHandler.createSuccessResponse({
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const appError = ServerErrorHandler.handle(error, {
      api: "audit-stats",
      operation: "getAuditStats",
    })

    return ServerErrorHandler.createErrorResponse(appError)
  }
  },
  {
    context: { page: "audit-stats" },
    redirectOnAuth: "/sign-in?redirect=/admin/audit-stats",
    redirectOnAuthz: "/unauthorized",
  }
)

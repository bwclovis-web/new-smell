import { ServerErrorHandler } from "~/utils/errorHandling.server"
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { getRateLimitStats } from "~/utils/security/rate-limit-monitor.server"
import { requireAdmin } from "~/utils/requireAdmin.server"

export const ROUTE_PATH = "/admin/rate-limit-stats" as const

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    await requireAdmin(request)
  try {
    const stats = getRateLimitStats()

    return ServerErrorHandler.createSuccessResponse({
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const appError = ServerErrorHandler.handle(error, {
      api: "rate-limit-stats",
      operation: "getRateLimitStats",
    })

    return ServerErrorHandler.createErrorResponse(appError)
  }
  },
  {
    context: { page: "rate-limit-stats" },
    redirectOnAuth: "/sign-in?redirect=/admin/rate-limit-stats",
    redirectOnAuthz: "/unauthorized",
  }
)

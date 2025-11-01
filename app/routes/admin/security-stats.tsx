import { ServerErrorHandler } from "~/utils/errorHandling.server"
import { getSecurityStats } from "~/utils/security/security-monitor.server"

export const ROUTE_PATH = "/admin/security-stats" as const

export const loader = async () => {
  try {
    // Check if getSecurityStats function exists
    if (typeof getSecurityStats !== "function") {
      throw new Error("getSecurityStats function is not available")
    }

    const stats = getSecurityStats()

    // Validate the stats object structure
    if (!stats || typeof stats !== "object") {
      throw new Error("Invalid security stats data structure")
    }

    return ServerErrorHandler.createSuccessResponse({
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const appError = ServerErrorHandler.handle(error, {
      api: "security-stats",
      operation: "getSecurityStats",
    })

    return ServerErrorHandler.createErrorResponse(appError)
  }
}

import type { LoaderFunctionArgs } from "react-router"

import { getUnreadAlertCount, getUserAlerts } from "~/models/user-alerts.server"
import { authenticateUser } from "~/utils/server/auth.server"
import { withLoaderErrorHandling } from "~/utils/server/errorHandling.server"

export const loader = withLoaderErrorHandling(
  async ({ request, params }: LoaderFunctionArgs) => {
    const userId = params.userId as string
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      throw new Response(authResult.error, { status: authResult.status })
    }

    // Users can only access their own alerts
    if (userId !== authResult.user.id) {
      throw new Response("Forbidden", { status: 403 })
    }

    // Try to fetch alerts, but gracefully handle if tables don't exist
    let alerts = []
    let unreadCount = 0

    try {
      const results = await Promise.all([
        getUserAlerts(userId),
        getUnreadAlertCount(userId),
      ])
      alerts = results[0]
      unreadCount = results[1]
    } catch (error) {
      // UserAlert tables don't exist in production yet - return empty defaults
      console.warn("UserAlert tables not available:", error)
    }

    return Response.json({
      alerts,
      unreadCount,
    })
  },
  {
    context: { api: "user-alerts", action: "loader" },
  }
)

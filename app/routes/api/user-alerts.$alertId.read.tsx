import type { ActionFunctionArgs } from "react-router"

import { markAlertAsRead } from "~/models/user-alerts.server"
import { ErrorHandler } from "~/utils/errorHandling"
import { authenticateUser } from "~/utils/server/auth.server"

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 })
  }

  const alertId = params.alertId as string
  const authResult = await authenticateUser(request)

  if (!authResult.success) {
    throw new Response(authResult.error, { status: authResult.status })
  }

  try {
    const result = await markAlertAsRead(alertId, authResult.user.id)

    if (result.count === 0) {
      throw new Response("Alert not found or already read", { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    // If UserAlert table doesn't exist, silently succeed
    if (
      error instanceof Error &&
      error.message.includes("does not exist in the current database")
    ) {
      console.warn("UserAlert table not available:", error)
      return Response.json({ success: true })
    }
    const appError = ErrorHandler.handle(error, {
      api: "user-alerts",
      action: "mark-read",
      alertId,
      userId: authResult.user.id,
    })
    throw new Response(appError.userMessage, { status: 500 })
  }
}

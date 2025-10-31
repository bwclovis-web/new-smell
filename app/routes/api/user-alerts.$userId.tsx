import type { LoaderFunctionArgs } from 'react-router'

import { getUnreadAlertCount, getUserAlerts } from '~/models/user-alerts.server'
import { authenticateUser } from '~/utils/auth.server'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = params.userId as string
  const authResult = await authenticateUser(request)

  if (!authResult.success) {
    throw new Response(authResult.error, { status: authResult.status })
  }

  // Users can only access their own alerts
  if (userId !== authResult.user.id) {
    throw new Response('Forbidden', { status: 403 })
  }

  try {
    const [alerts, unreadCount] = await Promise.all([
      getUserAlerts(userId),
      getUnreadAlertCount(userId)
    ])

    return Response.json({
      alerts,
      unreadCount
    })
  } catch (error) {
    const { ErrorHandler } = await import('~/utils/errorHandling')
    const appError = ErrorHandler.handle(error, { api: 'user-alerts', action: 'loader', userId })
    throw new Response(appError.userMessage, { status: 500 })
  }
}

import type { LoaderFunctionArgs } from 'react-router'

import { getUnreadAlertCount, getUserAlerts } from '~/models/user-alerts.server'
import { authenticateUser } from '~/utils/auth.server'
import { withLoaderErrorHandling } from '~/utils/errorHandling.server'

export const loader = withLoaderErrorHandling(
  async ({ request, params }: LoaderFunctionArgs) => {
    const userId = params.userId as string
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      throw new Response(authResult.error, { status: authResult.status })
    }

    // Users can only access their own alerts
    if (userId !== authResult.user.id) {
      throw new Response('Forbidden', { status: 403 })
    }

    const [alerts, unreadCount] = await Promise.all([
      getUserAlerts(userId),
      getUnreadAlertCount(userId)
    ])

    return Response.json({
      alerts,
      unreadCount
    })
  },
  {
    context: { api: 'user-alerts', action: 'loader' }
  }
)

import type { ActionFunctionArgs } from 'react-router'

import { markAlertAsRead } from '~/models/user-alerts.server'
import { authenticateUser } from '~/utils/auth.server'

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    throw new Response('Method not allowed', { status: 405 })
  }

  const alertId = params.alertId as string
  const authResult = await authenticateUser(request)

  if (!authResult.success) {
    throw new Response(authResult.error, { status: authResult.status })
  }

  try {
    const result = await markAlertAsRead(alertId, authResult.user.id)

    if (result.count === 0) {
      throw new Response('Alert not found or already read', { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error marking alert as read:', error)
    throw new Response('Internal Server Error', { status: 500 })
  }
}

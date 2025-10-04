import type { ActionFunctionArgs } from 'react-router'

import { dismissAllAlerts } from '~/models/user-alerts.server'
import { authenticateUser } from '~/utils/auth.server'

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    throw new Response('Method not allowed', { status: 405 })
  }

  const userId = params.userId as string
  const authResult = await authenticateUser(request)

  if (!authResult.success) {
    throw new Response(authResult.error, { status: authResult.status })
  }

  // Users can only dismiss their own alerts
  if (userId !== authResult.user.id) {
    throw new Response('Forbidden', { status: 403 })
  }

  try {
    await dismissAllAlerts(userId)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error dismissing all alerts:', error)
    throw new Response('Internal Server Error', { status: 500 })
  }
}

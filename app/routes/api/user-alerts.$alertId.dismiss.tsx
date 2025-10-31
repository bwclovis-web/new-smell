import type { ActionFunctionArgs } from 'react-router'

import { dismissAlert } from '~/models/user-alerts.server'
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
    const result = await dismissAlert(alertId, authResult.user.id)

    if (result.count === 0) {
      throw new Response('Alert not found', { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    const { ErrorHandler } = await import('~/utils/errorHandling')
    const appError = ErrorHandler.handle(error, { api: 'user-alerts', action: 'dismiss', alertId, userId: authResult.user.id })
    throw new Response(appError.userMessage, { status: 500 })
  }
}

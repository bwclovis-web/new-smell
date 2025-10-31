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
    // If UserAlert table doesn't exist, silently succeed
    if (error instanceof Error && error.message.includes('does not exist in the current database')) {
      console.warn('UserAlert table not available:', error)
      return Response.json({ success: true })
    }
    const { ErrorHandler } = await import('~/utils/errorHandling')
    const appError = ErrorHandler.handle(error, { api: 'user-alerts', action: 'dismiss-all', userId })
    throw new Response(appError.userMessage, { status: 500 })
  }
}

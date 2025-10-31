import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'

import {
  getUserAlertPreferences,
  updateUserAlertPreferences
} from '~/models/user-alerts.server'
import type { UserAlertPreferences } from '~/types/database'
import { authenticateUser } from '~/utils/auth.server'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = params.userId as string
  const authResult = await authenticateUser(request)

  if (!authResult.success) {
    throw new Response(authResult.error, { status: authResult.status })
  }

  // Users can only access their own preferences
  if (userId !== authResult.user.id) {
    throw new Response('Forbidden', { status: 403 })
  }

  try {
    const preferences = await getUserAlertPreferences(userId)
    return Response.json(preferences)
  } catch (error) {
    const { ErrorHandler } = await import('~/utils/errorHandling')
    const appError = ErrorHandler.handle(error, { api: 'user-alerts-preferences', action: 'loader', userId })
    throw new Response(appError.userMessage, { status: 500 })
  }
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== 'PUT') {
    throw new Response('Method not allowed', { status: 405 })
  }

  const userId = params.userId as string
  const authResult = await authenticateUser(request)

  if (!authResult.success) {
    throw new Response(authResult.error, { status: authResult.status })
  }

  // Users can only update their own preferences
  if (userId !== authResult.user.id) {
    throw new Response('Forbidden', { status: 403 })
  }

  try {
    const body = await request.json()
    const preferences: Partial<Omit<UserAlertPreferences, 'id' | 'userId' | 'user'>> = body

    // Validate the preferences
    const validPreferences: Partial<Omit<UserAlertPreferences, 'id' | 'userId' | 'user'>> = {}

    if (typeof preferences.wishlistAlertsEnabled === 'boolean') {
      validPreferences.wishlistAlertsEnabled = preferences.wishlistAlertsEnabled
    }

    if (typeof preferences.decantAlertsEnabled === 'boolean') {
      validPreferences.decantAlertsEnabled = preferences.decantAlertsEnabled
    }

    if (typeof preferences.emailWishlistAlerts === 'boolean') {
      validPreferences.emailWishlistAlerts = preferences.emailWishlistAlerts
    }

    if (typeof preferences.emailDecantAlerts === 'boolean') {
      validPreferences.emailDecantAlerts = preferences.emailDecantAlerts
    }

    if (typeof preferences.maxAlerts === 'number' && preferences.maxAlerts >= 1 && preferences.maxAlerts <= 100) {
      validPreferences.maxAlerts = preferences.maxAlerts
    }

    const updatedPreferences = await updateUserAlertPreferences(userId, validPreferences)
    return Response.json(updatedPreferences)
  } catch (error) {
    const { ErrorHandler } = await import('~/utils/errorHandling')
    const appError = ErrorHandler.handle(error, { api: 'user-alerts-preferences', action: 'update', userId })
    throw new Response(appError.userMessage, { status: 500 })
  }
}

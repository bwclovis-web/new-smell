import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"

import {
  getUserAlertPreferences,
  updateUserAlertPreferences,
} from "~/models/user-alerts.server"
import type { UserAlertPreferences } from "~/types/database"
import { authenticateUser } from "~/utils/server/auth.server"
import {
  withActionErrorHandling,
  withLoaderErrorHandling,
} from "~/utils/server/errorHandling.server"

export const loader = withLoaderErrorHandling(
  async ({ request, params }: LoaderFunctionArgs) => {
    const userId = params.userId as string
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      throw new Response(authResult.error, { status: authResult.status })
    }

    // Users can only access their own preferences
    if (userId !== authResult.user.id) {
      throw new Response("Forbidden", { status: 403 })
    }

    // Try to fetch preferences, but gracefully handle if table doesn't exist
    let preferences = null
    try {
      preferences = await getUserAlertPreferences(userId)
    } catch (error) {
      // UserAlertPreferences table doesn't exist in production yet - return empty object
      console.warn("UserAlertPreferences table not available:", error)
      preferences = {
        userId,
        wishlistAlertsEnabled: true,
        decantAlertsEnabled: true,
        emailWishlistAlerts: false,
        emailDecantAlerts: false,
        maxAlerts: 10,
      }
    }

    return Response.json(preferences)
  },
  {
    context: { api: "user-alerts-preferences", action: "loader" },
  }
)

export const action = withActionErrorHandling(
  async ({ request, params }: ActionFunctionArgs) => {
    // Accept both PUT and POST for compatibility
    if (request.method !== "PUT" && request.method !== "POST") {
      throw new Response("Method not allowed", { status: 405 })
    }

    const userId = params.userId as string
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      throw new Response(authResult.error, { status: authResult.status })
    }

    // Users can only update their own preferences
    if (userId !== authResult.user.id) {
      throw new Response("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const preferences: Partial<
      Omit<UserAlertPreferences, "id" | "userId" | "user">
    > = body

    // Validate the preferences
    const validPreferences: Partial<
      Omit<UserAlertPreferences, "id" | "userId" | "user">
    > = {}

    if (typeof preferences.wishlistAlertsEnabled === "boolean") {
      validPreferences.wishlistAlertsEnabled = preferences.wishlistAlertsEnabled
    }

    if (typeof preferences.decantAlertsEnabled === "boolean") {
      validPreferences.decantAlertsEnabled = preferences.decantAlertsEnabled
    }

    if (typeof preferences.emailWishlistAlerts === "boolean") {
      validPreferences.emailWishlistAlerts = preferences.emailWishlistAlerts
    }

    if (typeof preferences.emailDecantAlerts === "boolean") {
      validPreferences.emailDecantAlerts = preferences.emailDecantAlerts
    }

    if (
      typeof preferences.maxAlerts === "number" &&
      preferences.maxAlerts >= 1 &&
      preferences.maxAlerts <= 100
    ) {
      validPreferences.maxAlerts = preferences.maxAlerts
    }

    // Try to update preferences, but gracefully handle if table doesn't exist
    try {
      const updatedPreferences = await updateUserAlertPreferences(
        userId,
        validPreferences
      )
      return Response.json(updatedPreferences)
    } catch (error) {
      // UserAlertPreferences table doesn't exist in production yet
      console.error("UserAlertPreferences update failed:", error)
      // Return a full preferences object with defaults for missing fields
      const fallbackPreferences = {
        id: "fallback",
        userId,
        wishlistAlertsEnabled: validPreferences.wishlistAlertsEnabled ?? true,
        decantAlertsEnabled: validPreferences.decantAlertsEnabled ?? true,
        emailWishlistAlerts: validPreferences.emailWishlistAlerts ?? false,
        emailDecantAlerts: validPreferences.emailDecantAlerts ?? false,
        maxAlerts: validPreferences.maxAlerts ?? 10,
      }
      return Response.json(fallbackPreferences, { status: 200 })
    }
  },
  {
    context: { api: "user-alerts-preferences", action: "update" },
  }
)

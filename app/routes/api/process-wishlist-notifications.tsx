import type { ActionFunctionArgs } from "react-router"

import { ErrorHandler } from "~/utils/errorHandling"
import { processWishlistNotifications } from "~/utils/wishlist-notification-processor"

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const results = await processWishlistNotifications()

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        notifications: results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      api: "process-wishlist-notifications",
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: appError.userMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

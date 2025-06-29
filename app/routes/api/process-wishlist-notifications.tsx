import type { ActionFunctionArgs } from 'react-router'

import { processWishlistNotifications } from '~/utils/wishlist-notification-processor'

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const results = await processWishlistNotifications()

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        notifications: results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing wishlist notifications:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process notifications'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

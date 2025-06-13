import type { ActionFunctionArgs } from 'react-router'

import { getUser } from '~/models/session.server'
import { addToWishlist, removeFromWishlist } from '~/models/wishlist.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const perfumeId = formData.get('perfumeId') as string
  const actionType = formData.get('action') as string

  if (!perfumeId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Perfume ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Get user from session
  const user = await getUser({ userSession: request })
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'User not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    if (actionType === 'add') {
      const result = await addToWishlist(user.id, perfumeId)
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (actionType === 'remove') {
      const result = await removeFromWishlist(user.id, perfumeId)
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update wishlist' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

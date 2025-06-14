import { parseCookies, verifyJwt } from '@api/utils'
import type { ActionFunctionArgs } from 'react-router'

import { getUserById } from '~/models/user.server'
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
  // Get user from cookies/JWT token
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = parseCookies({ headers: { cookie: cookieHeader } })

    if (!cookies.token) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const payload = verifyJwt(cookies.token)
    if (!payload || !payload.userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await getUserById(payload.userId)
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

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
  } catch (error) {
    console.error('Wishlist operation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update wishlist' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

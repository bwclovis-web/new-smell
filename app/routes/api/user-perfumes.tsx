import { parseCookies, verifyJwt } from '@api/utils'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'

import { getAllPerfumes } from '~/models/perfume.server'
import { getUserById } from '~/models/user.server'
import { addUserPerfume, getUserPerfumes, removeUserPerfume } from '~/models/user.server'

// Loader function to get user perfumes and all perfumes for dropdown
export const loader = async ({ request }: LoaderFunctionArgs) => {
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

    // Get user perfumes and all perfumes
    const userPerfumes = await getUserPerfumes(user.id)
    const allPerfumes = await getAllPerfumes()

    return new Response(
      JSON.stringify({ success: true, userPerfumes, allPerfumes }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
  catch (error) {
    console.error('Error fetching user perfumes:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch perfumes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Action function to add or remove user perfumes
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
      const result = await addUserPerfume(user.id, perfumeId)
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (actionType === 'remove') {
      const result = await removeUserPerfume(user.id, perfumeId)
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
  catch (error) {
    console.error('User perfume operation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update user perfumes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

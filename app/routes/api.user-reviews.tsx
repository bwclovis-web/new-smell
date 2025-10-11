import type { LoaderFunction } from 'react-router'

import { getPendingReviews, getUserReviews } from '~/models/perfumeReview.server'
import { authenticateUser } from '~/utils/auth.server'
import { createErrorResponse } from '~/utils/response.server'

const handlePendingReviews = async (user: any, page: number, limit: number) => {
  if (user.role !== 'admin' && user.role !== 'editor') {
    return createErrorResponse('Insufficient permissions', 403)
  }

  const result = await getPendingReviews({ page, limit })
  return result
}

const handleUserReviews = async (userId: string, page: number, limit: number) => {
  const result = await getUserReviews(userId, { page, limit })
  return result
}

/**
 * GET /api/user-reviews - Get user's reviews or pending reviews for moderation
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    const authResult = await authenticateUser(request)
    if (!authResult.success) {
      return createErrorResponse(authResult.error!, authResult.status || 401)
    }

    const user = authResult.user!
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const type = url.searchParams.get('type')

    if (type === 'pending') {
      return handlePendingReviews(user, page, limit)
    }

    return handleUserReviews(user.id, page, limit)
  } catch {
    return createErrorResponse('Failed to fetch user reviews', 500)
  }
}

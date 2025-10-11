import type { ActionFunction, LoaderFunction } from 'react-router'

import {
  createPerfumeReview,
  deletePerfumeReview,
  getPendingReviews,
  getPerfumeReviews,
  getUserPerfumeReview,
  getUserReviews,
  moderatePerfumeReview,
  updatePerfumeReview
} from '~/models/perfumeReview.server'
import { authenticateUser } from '~/utils/auth.server'
import { createErrorResponse, createSuccessResponse } from '~/utils/response.server'

/**
 * GET /api/reviews - Get reviews with optional filters and pagination
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const perfumeId = url.searchParams.get('perfumeId')
    const userId = url.searchParams.get('userId')
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const isApproved = url.searchParams.get('isApproved')

    if (!perfumeId && !userId) {
      return createErrorResponse('Either perfumeId or userId is required', 400)
    }

    const filters: any = {}
    if (perfumeId) {
      filters.perfumeId = perfumeId
    }
    if (userId) {
      filters.userId = userId
    }
    if (isApproved !== null) {
      filters.isApproved = isApproved === 'true'
    }

    const result = await getPerfumeReviews(perfumeId || '', filters, { page, limit })

    return result
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return createErrorResponse('Failed to fetch reviews', 500)
  }
}

/**
 * POST /api/reviews - Create a new review
 */
export const action: ActionFunction = async ({ request }) => {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request)
    if (!authResult.success) {
      return createErrorResponse(authResult.error!, authResult.status || 401)
    }

    const user = authResult.user!
    const formData = await request.formData()
    const action = formData.get('_action') as string

    switch (action) {
      case 'create': {
        const perfumeId = formData.get('perfumeId') as string
        const review = formData.get('review') as string

        if (!perfumeId || !review) {
          return createErrorResponse('Perfume ID and review content are required', 400)
        }

        // Check if user already has a review for this perfume
        const existingReview = await getUserPerfumeReview(user.id, perfumeId)
        if (existingReview) {
          return createErrorResponse('You have already reviewed this perfume', 400)
        }

        const newReview = await createPerfumeReview({
          userId: user.id,
          perfumeId,
          review
        })

        return createSuccessResponse({ message: 'Review created successfully', data: newReview })
      }

      case 'update': {
        const reviewId = formData.get('reviewId') as string
        const review = formData.get('review') as string

        if (!reviewId || !review) {
          return createErrorResponse('Review ID and review content are required', 400)
        }

        const updatedReview = await updatePerfumeReview(reviewId, { review }, user.id)
        return createSuccessResponse({ message: 'Review updated successfully', data: updatedReview })
      }

      case 'delete': {
        const reviewId = formData.get('reviewId') as string

        if (!reviewId) {
          return createErrorResponse('Review ID is required', 400)
        }

        await deletePerfumeReview(reviewId, user.id, user.role)
        return createSuccessResponse({ message: 'Review deleted successfully' })
      }

      case 'moderate': {
        // Only admin and editor roles can moderate
        if (user.role !== 'admin' && user.role !== 'editor') {
          return createErrorResponse('Insufficient permissions', 403)
        }

        const reviewId = formData.get('reviewId') as string
        const isApproved = formData.get('isApproved') === 'true'

        if (!reviewId) {
          return createErrorResponse('Review ID is required', 400)
        }

        const moderatedReview = await moderatePerfumeReview(reviewId, isApproved)
        return createSuccessResponse({ message: 'Review moderated successfully', data: moderatedReview })
      }

      default:
        return createErrorResponse('Invalid action', 400)
    }
  } catch (error) {
    console.error('Error in review action:', error)
    return createErrorResponse('An error occurred while processing the request', 500)
  }
}

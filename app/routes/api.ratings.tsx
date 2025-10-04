import type { ActionFunction } from 'react-router-dom'

import { createPerfumeRating, getUserPerfumeRating, updatePerfumeRating } from '~/models/perfumeRating.server'
import { createErrorResponse, createSuccessResponse } from '~/utils/response.server'
import { authenticateUser } from '~/utils/auth.server'


async function saveRating(
  userId: string,
  perfumeId: string,
  category: string,
  rating: number
) {
  const existingRating = await getUserPerfumeRating(userId, perfumeId)

  if (existingRating) {
    await updatePerfumeRating(existingRating.id, {
      [category]: rating
    })
  } else {
    await createPerfumeRating({
      userId,
      perfumeId,
      [category]: rating
    })
  }
}

export const action: ActionFunction = async ({ request }) => {
  try {
    // Authenticate user first (same pattern as wishlist)
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      return createErrorResponse(authResult.error!, authResult.status || 401)
    }

    const formData = await request.formData()

    // Extract data from form (no need to validate userId since we get it from auth)
    const category = formData.get('category') as string
    const rating = parseInt(formData.get('rating') as string, 10)
    const perfumeId = formData.get('perfumeId') as string

    // Validate required fields (userId comes from auth)
    if (!perfumeId || !category || isNaN(rating)) {
      return createErrorResponse('Missing required fields', 400)
    }

    // Validate rating value
    if (rating < 1 || rating > 5) {
      return createErrorResponse('Rating must be between 1 and 5', 400)
    }

    // Validate category
    const validCategories = ['longevity', 'sillage', 'gender', 'priceValue', 'overall']
    if (!validCategories.includes(category)) {
      return createErrorResponse('Invalid rating category', 400)
    }

    await saveRating(authResult.user.id, perfumeId, category, rating)
    return createSuccessResponse()
  } catch (error) {
    console.error('Rating action error:', error)
    return createErrorResponse('Failed to save rating', 500)
  }
}

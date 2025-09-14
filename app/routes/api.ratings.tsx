import type { ActionFunction } from 'react-router-dom'

import { createPerfumeRating, getUserPerfumeRating, updatePerfumeRating } from '~/models/perfumeRating.server'
import { CreateRatingSchema } from '~/utils/formValidationSchemas'
import { createErrorResponse, createSuccessResponse } from '~/utils/response.server'
import { validateFormData } from '~/utils/validation'

async function validateRatingData(formData: FormData): Promise<
  | { error: string; errors?: any[] }
  | { userId: string; perfumeId: string; category: string; rating: number }
> {
  // Extract the specific rating category and value from form data
  const category = formData.get('category') as string
  const rating = parseInt(formData.get('rating') as string, 10)
  const perfumeId = formData.get('perfumeId') as string
  const userId = formData.get('userId') as string

  // Validate required fields
  if (!userId || !perfumeId || !category || isNaN(rating)) {
    return { error: 'Missing required fields' }
  }

  // Validate rating value
  if (rating < 1 || rating > 5) {
    return { error: 'Rating must be between 1 and 5' }
  }

  // Validate category
  const validCategories = [
    'longevity',
    'sillage',
    'gender',
    'priceValue',
    'overall'
  ]
  if (!validCategories.includes(category)) {
    return { error: 'Invalid rating category' }
  }

  // Use comprehensive validation for the rating data
  const ratingData = {
    perfumeId,
    [category]: rating
  }

  const validation = validateFormData(CreateRatingSchema, new FormData(Object.entries(ratingData).map(([key, value]) => [key, String(value)])))

  if (!validation.success) {
    return {
      error: 'Validation failed',
      errors: validation.errors
    }
  }

  return { userId, perfumeId, category, rating }
}

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
    const formData = await request.formData()
    const validation = await validateRatingData(formData)

    if ('error' in validation) {
      return createErrorResponse(validation.error, 400, validation.errors)
    }

    const { userId, perfumeId, category, rating } = validation

    await saveRating(userId, perfumeId, category, rating)
    return createSuccessResponse()
  } catch (error) {
    console.error('Rating action error:', error)
    return createErrorResponse('Failed to save rating', 500)
  }
}

import type { ActionFunction } from 'react-router-dom'

import { createPerfumeRating, getUserPerfumeRating, updatePerfumeRating } from '~/models/perfumeRating.server'
import { createErrorResponse, createSuccessResponse } from '~/utils/response.server'

async function validateRatingData(formData: FormData): Promise<
  | { error: string }
  | { userId: string; perfumeId: string; category: string; rating: number }
> {
  const userId = formData.get('userId') as string
  const perfumeId = formData.get('perfumeId') as string
  const category = formData.get('category') as string
  const rating = parseInt(formData.get('rating') as string, 10)

  if (!userId || !perfumeId || !category || !rating || rating < 1 || rating > 5) {
    return { error: 'Invalid rating data' }
  }

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
  const formData = await request.formData()
  const validation = await validateRatingData(formData)

  if ('error' in validation) {
    return createErrorResponse(validation.error, 400)
  }

  const { userId, perfumeId, category, rating } = validation

  try {
    await saveRating(userId, perfumeId, category, rating)
    return createSuccessResponse()
  } catch {
    return createErrorResponse('Failed to save rating', 500)
  }
}

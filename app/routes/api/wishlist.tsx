import type { ActionFunctionArgs } from 'react-router'

import { addToWishlist, removeFromWishlist, updateWishlistVisibility } from '~/models/wishlist.server'
import { authenticateUser } from '~/utils/auth.server'
import { WishlistActionSchema } from '~/utils/formValidationSchemas'
import { createErrorResponse, createJsonResponse } from '~/utils/response.server'
import { validateFormData } from '~/utils/validation'

const processWishlistAction = async (
  userId: string,
  perfumeId: string,
  actionType: string,
  isPublic?: boolean
) => {
  if (actionType === 'add') {
    return await addToWishlist(userId, perfumeId, isPublic || false)
  }
  if (actionType === 'remove') {
    return await removeFromWishlist(userId, perfumeId)
  }
  if (actionType === 'updateVisibility') {
    if (isPublic === undefined) {
      throw new Error('isPublic is required for updateVisibility action')
    }
    return await updateWishlistVisibility(userId, perfumeId, isPublic)
  }
  throw new Error('Invalid action type')
}


const processAuthenticatedRequest = async (
  request: Request,
  perfumeId: string,
  actionType: string,
  isPublic?: boolean
) => {
  const authResult = await authenticateUser(request)

  if (!authResult.success) {
    return createErrorResponse(authResult.error!, authResult.status)
  }

  const result = await processWishlistAction(
    authResult.user.id,
    perfumeId,
    actionType,
    isPublic
  )

  return createJsonResponse(result)
}

const processRequest = async (request: Request) => {
  const formData = await request.formData()

  const validation = validateFormData(WishlistActionSchema, formData)
  if (!validation.success) {
    return createErrorResponse(
      'Validation failed',
      400,
      validation.errors
    )
  }

  const { perfumeId, action: actionType, isPublic } = validation.data!

  return await processAuthenticatedRequest(request, perfumeId, actionType, isPublic)
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    return await processRequest(request)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Wishlist operation error:', error)
    return createErrorResponse('Failed to update wishlist', 500)
  }
}


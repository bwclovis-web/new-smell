import type { ActionFunctionArgs } from 'react-router'

import { addToWishlist, removeFromWishlist } from '~/models/wishlist.server'
import { authenticateUser } from '~/utils/auth.server'
import { createErrorResponse, createJsonResponse } from '~/utils/response.server'
import { validateActionType, validatePerfumeId } from '~/utils/validation.server'

const processWishlistAction = async (
  userId: string,
  perfumeId: string,
  actionType: string
) => {
  if (actionType === 'add') {
    return await addToWishlist(userId, perfumeId)
  }
  if (actionType === 'remove') {
    return await removeFromWishlist(userId, perfumeId)
  }
  throw new Error('Invalid action type')
}

const validateRequestData = (perfumeId: string, actionType: string) => {
  const perfumeIdError = validatePerfumeId(perfumeId)
  if (perfumeIdError) {
    return perfumeIdError
  }

  const actionTypeError = validateActionType(actionType)
  if (actionTypeError) {
    return actionTypeError
  }

  return null
}

const processAuthenticatedRequest = async (
  request: Request,
  perfumeId: string,
  actionType: string
) => {
  const authResult = await authenticateUser(request)
  if (!authResult.success) {
    return createErrorResponse(authResult.error!, authResult.status)
  }

  const result = await processWishlistAction(
    authResult.user.id,
    perfumeId,
    actionType
  )

  return createJsonResponse(result)
}

const processRequest = async (request: Request) => {
  const formData = await request.formData()
  const perfumeId = formData.get('perfumeId') as string
  const actionType = formData.get('action') as string

  const validationError = validateRequestData(perfumeId, actionType)
  if (validationError) {
    return validationError
  }

  return await processAuthenticatedRequest(request, perfumeId, actionType)
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

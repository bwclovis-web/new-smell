import type { ActionFunctionArgs } from 'react-router'

import { addToWishlist, removeFromWishlist } from '~/models/wishlist.server'
import { authenticateUser } from '~/utils/auth.server'
import { createErrorResponse, createJsonResponse } from '~/utils/response.server'
import { validateFormData } from '~/utils/validation'
import { WishlistActionSchema } from '~/utils/formValidationSchemas'

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

const validateRequestData = (formData: FormData) => {
  const validation = validateFormData(WishlistActionSchema, formData)

  if (!validation.success) {
    return createErrorResponse(
      'Validation failed',
      400,
      validation.errors
    )
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

  const validationError = validateRequestData(formData)
  if (validationError) {
    return validationError
  }

  const perfumeId = formData.get('perfumeId') as string
  const actionType = formData.get('action') as string

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

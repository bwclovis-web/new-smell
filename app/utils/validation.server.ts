import { createErrorResponse } from './response.server'

export function validatePerfumeId(perfumeId: string | null) {
  if (!perfumeId) {
    return createErrorResponse('Perfume ID is required')
  }
  return null
}

export function validateActionType(actionType: string | null) {
  if (!actionType) {
    return createErrorResponse('Action type is required')
  }
  if (!['add', 'remove'].includes(actionType)) {
    return createErrorResponse('Invalid action')
  }
  return null
}

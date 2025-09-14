import { AppError, createErrorResponse as createAppErrorResponse } from './errorHandling'

export const createJsonResponse = (
  data: any,
  status = 200,
  headers: Record<string, string> = {}
) => new Response(
  JSON.stringify(data),
  {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }
)

export function createErrorResponse(error: string | AppError, status = 400) {
  if (error instanceof AppError) {
    return createAppErrorResponse(error, status)
  }
  return createJsonResponse({ success: false, error }, status)
}

export function createSuccessResponse(data?: any) {
  return createJsonResponse({ success: true, ...data })
}

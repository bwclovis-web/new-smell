/**
 * Reusable utilities for API route handlers
 * Reduces boilerplate and ensures consistency across API routes
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"

import { authenticateUser } from "~/utils/server/auth.server"
import { ErrorHandler } from "./errorHandling"
import { createErrorResponse, createSuccessResponse } from "./response.server"

// ==================== Types ====================

export interface AuthenticatedContext {
  userId: string
  user: {
    id: string
    email: string
    role: string
  }
}

export type AuthenticatedLoaderHandler<T = any> = (
  args: LoaderFunctionArgs & { auth: AuthenticatedContext }
) => Promise<Response | T>

export type AuthenticatedActionHandler<T = any> = (
  args: ActionFunctionArgs & { auth: AuthenticatedContext }
) => Promise<Response | T>

export type PublicLoaderHandler<T = any> = (
  args: LoaderFunctionArgs
) => Promise<Response | T>

// ==================== Query Parameter Helpers ====================

/**
 * Safely parse query parameters from URL
 */
export function parseQueryParams(request: Request) {
  const url = new URL(request.url)
  
  return {
    get(key: string): string | null {
      return url.searchParams.get(key)
    },
    
    getString(key: string, defaultValue: string = ""): string {
      return url.searchParams.get(key) || defaultValue
    },
    
    getInt(key: string, defaultValue: number = 0): number {
      const value = url.searchParams.get(key)
      if (!value) {
 return defaultValue 
}
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? defaultValue : parsed
    },
    
    getBoolean(key: string, defaultValue: boolean = false): boolean {
      const value = url.searchParams.get(key)
      if (value === null) {
 return defaultValue 
}
      return value === "true" || value === "1"
    },
    
    getAll(key: string): string[] {
      return url.searchParams.getAll(key)
    },
    
    required(key: string): string {
      const value = url.searchParams.get(key)
      if (!value) {
        throw new Error(`Required query parameter "${key}" is missing`)
      }
      return value
    },
  }
}

/**
 * Parse pagination parameters with defaults
 */
export function parsePaginationParams(request: Request) {
  const params = parseQueryParams(request)
  
  return {
    page: params.getInt("page", 1),
    limit: params.getInt("limit", 10),
    skip: params.getInt("skip", 0),
    take: params.getInt("take", 10),
  }
}

// ==================== FormData Helpers ====================

/**
 * Safely parse form data
 */
export async function parseFormData(request: Request) {
  const formData = await request.formData()
  
  return {
    get(key: string): string | null {
      const value = formData.get(key)
      return typeof value === "string" ? value : null
    },
    
    getString(key: string, defaultValue: string = ""): string {
      const value = formData.get(key)
      return typeof value === "string" ? value : defaultValue
    },
    
    getInt(key: string, defaultValue: number = 0): number {
      const value = formData.get(key)
      if (typeof value !== "string") {
 return defaultValue 
}
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? defaultValue : parsed
    },
    
    getBoolean(key: string, defaultValue: boolean = false): boolean {
      const value = formData.get(key)
      if (typeof value !== "string") {
 return defaultValue 
}
      return value === "true" || value === "1"
    },
    
    required(key: string): string {
      const value = formData.get(key)
      if (typeof value !== "string" || !value) {
        throw new Error(`Required form field "${key}" is missing`)
      }
      return value
    },
  }
}

// ==================== Authentication Wrappers ====================

/**
 * Wrapper for loaders that require authentication
 * 
 * @example
 * ```typescript
 * export const loader = withAuthenticatedLoader(async ({ request, auth }) => {
 *   const userId = auth.userId
 *   const data = await getData(userId)
 *   return createSuccessResponse(data)
 * })
 * ```
 */
export function withAuthenticatedLoader<T = any>(
  handler: AuthenticatedLoaderHandler<T>,
  options: { context?: Record<string, any> } = {}
): (args: LoaderFunctionArgs) => Promise<Response> {
  return async (args: LoaderFunctionArgs): Promise<Response> => {
    try {
      // Authenticate user
      const authResult = await authenticateUser(args.request)
      
      if (!authResult.success) {
        return createErrorResponse(
          authResult.error || "Unauthorized",
          authResult.status || 401
        )
      }
      
      // Call handler with auth context
      const result = await handler({
        ...args,
        auth: {
          userId: authResult.user.id,
          user: authResult.user,
        },
      })
      
      // If handler returned Response, use it directly
      if (result instanceof Response) {
        return result
      }
      
      // Otherwise wrap in success response
      return createSuccessResponse(result)
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        ...options.context,
        route: "loader",
      })
      return createErrorResponse(appError.userMessage, 500)
    }
  }
}

/**
 * Wrapper for actions that require authentication
 * 
 * @example
 * ```typescript
 * export const action = withAuthenticatedAction(async ({ request, auth }) => {
 *   const formData = await parseFormData(request)
 *   const perfumeId = formData.required("perfumeId")
 *   
 *   await createRating(auth.userId, perfumeId, rating)
 *   return createSuccessResponse({ message: "Success" })
 * })
 * ```
 */
export function withAuthenticatedAction<T = any>(
  handler: AuthenticatedActionHandler<T>,
  options: { context?: Record<string, any> } = {}
): (args: ActionFunctionArgs) => Promise<Response> {
  return async (args: ActionFunctionArgs): Promise<Response> => {
    try {
      // Authenticate user
      const authResult = await authenticateUser(args.request)
      
      if (!authResult.success) {
        return createErrorResponse(
          authResult.error || "Unauthorized",
          authResult.status || 401
        )
      }
      
      // Call handler with auth context
      const result = await handler({
        ...args,
        auth: {
          userId: authResult.user.id,
          user: authResult.user,
        },
      })
      
      // If handler returned Response, use it directly
      if (result instanceof Response) {
        return result
      }
      
      // Otherwise wrap in success response
      return createSuccessResponse(result)
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        ...options.context,
        route: "action",
      })
      return createErrorResponse(appError.userMessage, 500)
    }
  }
}

/**
 * Wrapper for public loaders (no authentication required)
 * Provides consistent error handling
 */
export function withPublicLoader<T = any>(
  handler: PublicLoaderHandler<T>,
  options: { context?: Record<string, any> } = {}
): (args: LoaderFunctionArgs) => Promise<Response> {
  return async (args: LoaderFunctionArgs): Promise<Response> => {
    try {
      const result = await handler(args)
      
      // If handler returned Response, use it directly
      if (result instanceof Response) {
        return result
      }
      
      // Otherwise wrap in success response
      return createSuccessResponse(result)
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        ...options.context,
        route: "loader",
      })
      return createErrorResponse(appError.userMessage, 500)
    }
  }
}

// ==================== Validation Helpers ====================

/**
 * Validate rating value (1-5)
 */
export function validateRating(rating: number): void {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5")
  }
}

/**
 * Validate rating category
 */
export function validateRatingCategory(category: string): void {
  const validCategories = [
    "longevity",
    "sillage",
    "gender",
    "priceValue",
    "overall",
  ]
  
  if (!validCategories.includes(category)) {
    throw new Error(`Invalid rating category. Must be one of: ${validCategories.join(", ")}`)
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  fields: Record<string, any>,
  fieldNames: string[]
): void {
  const missing = fieldNames.filter(name => !fields[name])
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`)
  }
}

// ==================== Response Helpers ====================

/**
 * Create a paginated response with metadata
 */
export function createPaginatedResponse(
  data: any[],
  pagination: {
    page: number
    limit: number
    totalCount: number
  }
) {
  const { page, limit, totalCount } = pagination
  const totalPages = Math.ceil(totalCount / limit)
  
  return createSuccessResponse({
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  })
}


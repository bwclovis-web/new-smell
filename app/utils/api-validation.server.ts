/**
 * API validation middleware and utilities
 * Provides comprehensive validation for API endpoints
 */

import { z } from "zod"

import { createErrorResponse } from "./response.server"
import type { ValidationResult } from "./validation"
import {
  validateData,
  validateFormData,
  validateJsonData,
  validateSearchParams,
} from "./validation"

// API validation middleware types
export interface ApiValidationOptions {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
  headers?: z.ZodSchema
  stripUnknown?: boolean
  abortEarly?: boolean
}

export interface ValidatedRequest<T = unknown> {
  body?: T
  query?: T
  params?: T
  headers?: T
}

// Validation error response
export function createValidationErrorResponse(
  errors: any[],
  message = "Validation failed"
) {
  return createErrorResponse(message, 400, { errors })
}

// Generic API validation middleware
export function createApiValidationMiddleware<T extends Record<string, unknown>>(options: ApiValidationOptions) {
  return async (request: Request): Promise<ValidatedRequest<T>> => {
    const validated: ValidatedRequest<T> = {}
    const errors: any[] = []

    try {
      // Validate request body
      if (options.body) {
        const contentType = request.headers.get("content-type")

        if (contentType?.includes("application/json")) {
          const bodyValidation = await validateJsonData(options.body, request, {
            stripUnknown: options.stripUnknown,
            abortEarly: options.abortEarly,
          })

          if (bodyValidation.success) {
            validated.body = bodyValidation.data
          } else {
            errors.push(...(bodyValidation.errors || []))
          }
        } else {
          const formData = await request.formData()
          const bodyValidation = validateFormData(options.body, formData, {
            stripUnknown: options.stripUnknown,
            abortEarly: options.abortEarly,
          })

          if (bodyValidation.success) {
            validated.body = bodyValidation.data
          } else {
            errors.push(...(bodyValidation.errors || []))
          }
        }
      }

      // Validate query parameters
      if (options.query) {
        const url = new URL(request.url)
        const queryValidation = validateSearchParams(
          options.query,
          url.searchParams,
          {
            stripUnknown: options.stripUnknown,
            abortEarly: options.abortEarly,
          }
        )

        if (queryValidation.success) {
          validated.query = queryValidation.data
        } else {
          errors.push(...(queryValidation.errors || []))
        }
      }

      // Validate URL parameters (if available)
      if (options.params) {
        // This would need to be passed from the route handler
        // For now, we'll skip this as it's route-specific
      }

      // Validate headers
      if (options.headers) {
        const headersData = Object.fromEntries(request.headers.entries())
        const headersValidation = validateData(options.headers, headersData, {
          stripUnknown: options.stripUnknown,
          abortEarly: options.abortEarly,
        })

        if (headersValidation.success) {
          validated.headers = headersValidation.data
        } else {
          errors.push(...(headersValidation.errors || []))
        }
      }

      // If there are validation errors, throw a response
      if (errors.length > 0) {
        throw new Response(
          JSON.stringify({
            success: false,
            error: "Validation failed",
            errors,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      return validated
    } catch (error) {
      if (error instanceof Response) {
        throw error
      }

      console.error("API validation error:", error)
      throw new Response(
        JSON.stringify({
          success: false,
          error: "Internal validation error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
  }
}

// Specific validation middleware for common patterns
export const validatePerfumeId = createApiValidationMiddleware({
  query: z.object({
    id: z.string().min(1, "Perfume ID is required"),
  }),
})

export const validateUserAction = createApiValidationMiddleware({
  body: z.object({
    action: z.enum(["add", "remove", "update"], {
      errorMap: () => ({ message: "Action must be add, remove, or update" }),
    }),
    perfumeId: z.string().min(1, "Perfume ID is required"),
  }),
})

export const validateRatingSubmission = createApiValidationMiddleware({
  body: z
    .object({
      perfumeId: z.string().min(1, "Perfume ID is required"),
      longevity: z.number().min(1).max(5).optional(),
      sillage: z.number().min(1).max(5).optional(),
      gender: z.number().min(1).max(5).optional(),
      priceValue: z.number().min(1).max(5).optional(),
      overall: z.number().min(1).max(5).optional(),
    })
    .refine(
      data => {
        const ratings = [
          data.longevity,
          data.sillage,
          data.gender,
          data.priceValue,
          data.overall,
        ]
        return ratings.some(rating => rating !== undefined)
      },
      {
        message: "At least one rating is required",
      }
    ),
})

export const validateCommentSubmission = createApiValidationMiddleware({
  body: z.object({
    perfumeId: z.string().min(1, "Perfume ID is required"),
    userPerfumeId: z.string().min(1, "User perfume ID is required"),
    comment: z
      .string()
      .min(1, "Comment is required")
      .max(1000, "Comment must be less than 1000 characters")
      .trim(),
    isPublic: z.boolean().optional(),
  }),
})

export const validateSearchQuery = createApiValidationMiddleware({
  query: z.object({
    q: z.string().max(100, "Search query too long").optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.enum([
"name", "price", "rating", "createdAt"
]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
})

// Pagination validation
export function validatePaginationParams(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)

  if (page < 1) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: "Page must be 1 or greater",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  if (limit < 1 || limit > 100) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: "Limit must be between 1 and 100",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return { page, limit, offset: (page - 1) * limit }
}

// Authentication validation
export function validateAuthHeaders(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: "Authorization header is required",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: "Invalid authorization format",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

// Content-Type validation
export function validateContentType(request: Request, expectedTypes: string[]) {
  const contentType = request.headers.get("content-type")

  if (!contentType) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: "Content-Type header is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  const isValidType = expectedTypes.some(type => contentType.includes(type))

  if (!isValidType) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: `Content-Type must be one of: ${expectedTypes.join(", ")}`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return contentType
}

// Rate limiting validation (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function validateRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const now = Date.now()
  const key = identifier
  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return
  }

  if (current.count >= maxRequests) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((current.resetTime - now) / 1000).toString(),
        },
      }
    )
  }

  current.count++
}

// CSRF validation - delegates to canonical csrf.server (timing-safe)
export async function validateCSRFOrThrow(
  request: Request,
  formData?: FormData
): Promise<void> {
  const { requireCSRF } = await import("~/utils/server/csrf.server")
  await requireCSRF(request, formData)
}

// File upload validation
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
) {
  const {
    maxSize = 5 * 1024 * 1024,
    allowedTypes = [],
    allowedExtensions = [],
  } = options

  if (file.size > maxSize) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: `File type must be one of: ${allowedTypes.join(", ")}`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  if (allowedExtensions.length > 0) {
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new Response(
        JSON.stringify({
          success: false,
          error: `File extension must be one of: ${allowedExtensions.join(", ")}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
  }
}

// Export common validation schemas for reuse
export const commonApiSchemas = {
  id: z.string().min(1, "ID is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  url: z.string().url("Invalid URL format"),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number"),
  year: z.string().regex(/^(19|20)\d{2}$/, "Invalid year format"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  pagination: z.object({
    page: z.number().min(1, "Page must be 1 or greater"),
    limit: z.number().min(1).max(100, "Limit must be between 1 and 100"),
  }),
} as const

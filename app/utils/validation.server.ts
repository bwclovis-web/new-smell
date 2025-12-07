import { z } from "zod"

import { createErrorResponse } from "./response.server"
import {
  validateAmount,
  validateEnum,
  validateId,
  validateRating,
} from "./validation"

// Enhanced validation functions with better error handling
export function validatePerfumeId(perfumeId: string | null) {
  if (!perfumeId) {
    return createErrorResponse("Perfume ID is required", 400)
  }

  try {
    validateId(perfumeId, "Perfume ID")
    return null
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Invalid perfume ID",
      400
    )
  }
}

export function validateActionType(actionType: string | null) {
  if (!actionType) {
    return createErrorResponse("Action type is required", 400)
  }

  try {
    validateEnum(actionType, ["add", "remove"] as const, "Action type")
    return null
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Invalid action type",
      400
    )
  }
}

export function validateUserId(userId: string | null) {
  if (!userId) {
    return createErrorResponse("User ID is required", 400)
  }

  try {
    validateId(userId, "User ID")
    return null
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Invalid user ID",
      400
    )
  }
}

export function validateCommentId(commentId: string | null) {
  if (!commentId) {
    return createErrorResponse("Comment ID is required", 400)
  }

  try {
    validateId(commentId, "Comment ID")
    return null
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Invalid comment ID",
      400
    )
  }
}

export function validateRatingValue(rating: number | null) {
  if (rating === null || rating === undefined) {
    return createErrorResponse("Rating is required", 400)
  }

  try {
    validateRating(rating)
    return null
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Invalid rating value",
      400
    )
  }
}

export function validateAmountValue(amount: string | null) {
  if (!amount) {
    return createErrorResponse("Amount is required", 400)
  }

  try {
    validateAmount(amount)
    return null
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Invalid amount value",
      400
    )
  }
}

export function validatePriceValue(price: string | null) {
  if (!price) {
    return null // Price is optional
  }

  try {
    validateAmount(price)
    return null
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Invalid price value",
      400
    )
  }
}

export function validateEmailValue(email: string | null) {
  if (!email) {
    return createErrorResponse("Email is required", 400)
  }

  try {
    const emailSchema = z
      .string()
      .email({ message: "Please enter a valid email address" })
    emailSchema.parse(email)
    return null
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0]?.message || "Invalid email address", 400)
    }
    return createErrorResponse("Please enter a valid email address", 400)
  }
}

export function validatePasswordValue(password: string | null) {
  if (!password) {
    return createErrorResponse("Password is required", 400)
  }

  try {
    const passwordSchema = z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(128, { message: "Password must be less than 128 characters" })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Password must contain at least one special character",
      })
      .refine(pwd => !pwd.includes(" "), {
        message: "Password cannot contain spaces",
      })

    passwordSchema.parse(password)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0]?.message || "Invalid password", 400)
    }
    return createErrorResponse("Invalid password", 400)
  }
}

export function validateUrlValue(url: string | null) {
  if (!url) {
    return null // URL is optional
  }

  try {
    const urlSchema = z.string().url({ message: "Please enter a valid URL" })
    urlSchema.parse(url)
    return null
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0]?.message || "Invalid URL", 400)
    }
    return createErrorResponse("Please enter a valid URL", 400)
  }
}

export function validatePhoneValue(phone: string | null) {
  if (!phone) {
    return null // Phone is optional
  }

  try {
    const phoneSchema = z.string().regex(/^[+]?[1-9][\d]{0,15}$/, {
      message: "Please enter a valid phone number",
    })
    phoneSchema.parse(phone)
    return null
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0]?.message || "Invalid phone number", 400)
    }
    return createErrorResponse("Please enter a valid phone number", 400)
  }
}

export function validateYearValue(year: string | null) {
  if (!year) {
    return null // Year is optional
  }

  try {
    const yearSchema = z.string().regex(/^(19|20)\d{2}$/, {
      message: "Please enter a valid year (1900-2099)",
    })
    yearSchema.parse(year)
    return null
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors[0]?.message || "Invalid year", 400)
    }
    return createErrorResponse("Please enter a valid year (1900-2099)", 400)
  }
}

// Validation schemas for common patterns
export const commonValidationSchemas = {
  id: z
    .string()
    .min(1, { message: "ID is required" })
    .regex(/^[a-zA-Z0-9-_]+$/, {
      message: "ID contains invalid characters",
    }),

  email: z.string().email({ message: "Please enter a valid email address" }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(128, { message: "Password must be less than 128 characters" })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character",
    })
    .refine(pwd => !pwd.includes(" "), {
      message: "Password cannot contain spaces",
    }),

  url: z.string().url({ message: "Please enter a valid URL" }).optional(),

  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, {
      message: "Please enter a valid phone number",
    })
    .optional(),

  year: z
    .string()
    .regex(/^(19|20)\d{2}$/, {
      message: "Please enter a valid year (1900-2099)",
    })
    .optional(),

  rating: z
    .number()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be at most 5" }),

  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: "Amount must be a positive number with up to 2 decimal places",
  }),

  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, {
      message: "Price must be a positive number with up to 2 decimal places",
    })
    .optional(),

  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" })
    .trim(),

  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),

  comment: z
    .string()
    .min(1, { message: "Comment is required" })
    .max(1000, { message: "Comment must be less than 1000 characters" })
    .trim(),

  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must be less than 30 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    })
    .trim(),
} as const

// Generic validation function
export function validateField<T>(
  value: T,
  schema: z.ZodSchema<T>,
  fieldName: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(value)
    return { success: true, data }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || `Invalid ${fieldName}`,
      }
    }
    return {
      success: false,
      error: `Invalid ${fieldName}`,
    }
  }
}

// Validate multiple fields at once
export function validateFields<T extends Record<string, unknown>>(
  data: T,
  schemas: Record<keyof T, z.ZodSchema>
): { success: true; data: T } | { success: false; errors: Record<keyof T, string> } {
  const errors = {} as Record<keyof T, string>
  const validatedData = {} as T

  for (const [field, schema] of Object.entries(schemas)) {
    const result = validateField(data[field], schema, field)

    if (result.success) {
      validatedData[field as keyof T] = result.data
    } else {
      errors[field as keyof T] = result.error
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: validatedData }
}

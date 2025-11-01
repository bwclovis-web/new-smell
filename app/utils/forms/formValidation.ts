/**
 * Common form validation utilities
 * 
 * This module provides reusable validation functions and patterns
 * to reduce duplication across forms.
 */

import type { ZodSchema } from 'zod'

/**
 * Common validation error messages
 */
export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must be at most ${max} characters`,
  match: (field1: string, field2: string) => `${field1} and ${field2} must match`,
  invalidFormat: (field: string) => `${field} has an invalid format`,
} as const

/**
 * Validation result type
 */
export type ValidationResult<T = Record<string, any>> = {
  success: boolean
  data?: T
  errors?: Record<keyof T, string>
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * Validate password strength
 * Returns true if password meets minimum requirements
 */
export function validatePassword(password: string, options: {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
} = {}): { valid: boolean; message?: string } {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = options

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters`
    }
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    }
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    }
  }

  if (requireNumbers && !/\d/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    }
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character'
    }
  }

  return { valid: true }
}

/**
 * Validate that two fields match (e.g., password confirmation)
 */
export function validateMatch(value1: string, value2: string, fieldName: string = 'Passwords'): string | null {
  if (value1 !== value2) {
    return `${fieldName} do not match`
  }
  return null
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return VALIDATION_MESSAGES.required(fieldName)
  }
  return null
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value.length < minLength) {
    return VALIDATION_MESSAGES.minLength(fieldName, minLength)
  }
  return null
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value.length > maxLength) {
    return VALIDATION_MESSAGES.maxLength(fieldName, maxLength)
  }
  return null
}

/**
 * Combine multiple validation results
 */
export function combineValidationErrors(
  ...validations: (string | null)[]
): string | null {
  const errors = validations.filter(Boolean)
  return errors.length > 0 ? errors[0] : null
}

/**
 * Validate form data against Zod schema
 * Returns validation result with typed data or errors
 */
export function validateWithZod<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData
    }
  } catch (error: any) {
    const errors: Record<string, string> = {}
    
    if (error.errors) {
      for (const err of error.errors) {
        const path = err.path.join('.')
        errors[path] = err.message
      }
    }
    
    return {
      success: false,
      errors: errors as Record<keyof T, string>
    }
  }
}

/**
 * Create a validator function that can be used with useFormSubmit
 */
export function createValidator<T extends Record<string, any>>(
  rules: {
    [K in keyof T]?: (value: T[K], allValues: T) => string | null
  }
) {
  return (data: T): Record<string, string> | null => {
    const errors: Record<string, string> = {}
    let hasErrors = false
    
    for (const [field, validator] of Object.entries(rules)) {
      if (validator) {
        const error = validator(data[field], data)
        if (error) {
          errors[field] = error
          hasErrors = true
        }
      }
    }
    
    return hasErrors ? errors : null
  }
}

/**
 * Common form validation schemas
 */
export const commonValidators = {
  email: (value: string) => 
    !validateEmail(value) ? VALIDATION_MESSAGES.email : null,
  
  required: (fieldName: string) => (value: any) =>
    validateRequired(value, fieldName),
  
  minLength: (fieldName: string, min: number) => (value: string) =>
    validateMinLength(value, min, fieldName),
  
  maxLength: (fieldName: string, max: number) => (value: string) =>
    validateMaxLength(value, max, fieldName),
  
  password: (value: string) => {
    const result = validatePassword(value)
    return result.valid ? null : result.message || 'Invalid password'
  },
  
  confirmPassword: (passwordField: string = 'password') => 
    (value: string, allValues: any) =>
      validateMatch(allValues[passwordField], value, 'Passwords')
}

/**
 * Sanitize form input to prevent XSS
 */
export function sanitizeFormInput(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Sanitize all string fields in an object
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data }
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeFormInput(value)
    }
  }
  
  return sanitized
}


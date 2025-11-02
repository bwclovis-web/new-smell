/**
 * Common form submission utilities
 *
 * This module provides reusable form handling logic to reduce duplication
 * across the application. It includes hooks for client-side form submission
 * and utilities for server-side action handling.
 */

import { type FormEvent, useCallback, useState } from "react"

/**
 * Options for useFormSubmit hook
 */
export interface UseFormSubmitOptions<T> {

  /** Validation function to run before submission */
  validate?: (data: T) => Record<string, string> | null

  /** Function to call on successful submission */
  onSuccess?: (result: any) => void

  /** Function to call on error */
  onError?: (error: unknown) => void

  /** Function to transform form data before submission */
  transform?: (data: T) => T

  /** Whether to reset the form after successful submission */
  resetOnSuccess?: boolean
}

/**
 * Return type for useFormSubmit hook
 */
export interface UseFormSubmitReturn<T> {

  /** Handler for form submission */
  handleSubmit: (
    submitFn: (data: T) => Promise<any>
  ) => (e: FormEvent<HTMLFormElement>) => Promise<void>

  /** Whether form is currently submitting */
  isSubmitting: boolean

  /** Validation errors */
  errors: Record<string, string> | null

  /** Clear validation errors */
  clearErrors: () => void

  /** Set specific field error */
  setFieldError: (field: string, error: string) => void
}

/**
 * Hook for handling form submission with validation and error handling
 *
 * @example
 * ```typescript
 * const { handleSubmit, isSubmitting, errors } = useFormSubmit<LoginData>({
 *   validate: (data) => {
 *     if (!data.email) return { email: 'Email is required' }
 *     return null
 *   },
 *   onSuccess: (result) => navigate('/dashboard'),
 *   onError: (error) => console.error(error)
 * })
 *
 * return (
 *   <form onSubmit={handleSubmit(async (data) => {
 *     return await loginUser(data)
 *   })}>
 *     {/* form fields *\/}
 *   </form>
 * )
 * ```
 */
export function useFormSubmit<T>({
  validate,
  onSuccess,
  onError,
  transform,
  resetOnSuccess = false,
}: UseFormSubmitOptions<T> = {}): UseFormSubmitReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string> | null>(null)

  const clearErrors = useCallback(() => {
    setErrors(null)
  }, [])

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }))
  }, [])

  const handleSubmit = useCallback(
    (submitFn: (data: T) => Promise<any>) => async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Clear previous errors
        clearErrors()

        setIsSubmitting(true)

        try {
          // Extract form data
          const formData = new FormData(e.currentTarget)
          let data = Object.fromEntries(formData) as T

          // Transform data if transformer provided
          if (transform) {
            data = transform(data)
          }

          // Validate if validator provided
          if (validate) {
            const validationErrors = validate(data)
            if (validationErrors) {
              setErrors(validationErrors)
              return
            }
          }

          // Submit
          const result = await submitFn(data)

          // Handle success
          if (onSuccess) {
            onSuccess(result)
          }

          // Reset form if requested
          if (resetOnSuccess) {
            e.currentTarget.reset()
          }
        } catch (error) {
          // Handle error
          if (onError) {
            onError(error)
          } else {
            console.error("Form submission error:", error)
          }

          // Set generic error if no specific field errors
          if (error instanceof Error) {
            setErrors({ _form: error.message })
          }
        } finally {
          setIsSubmitting(false)
        }
      },
    [
validate, onSuccess, onError, transform, resetOnSuccess, clearErrors
]
  )

  return {
    handleSubmit,
    isSubmitting,
    errors,
    clearErrors,
    setFieldError,
  }
}

/**
 * Extract form data with type safety
 */
export function extractFormData<T extends Record<string, any>>(
  formData: FormData,
  fields: (keyof T)[]
): T {
  const data = {} as T

  for (const field of fields) {
    const value = formData.get(field as string)
    if (value !== null) {
      data[field] = value as T[keyof T]
    }
  }

  return data
}

/**
 * Convert FormData to plain object with type safety
 */
export function formDataToObject<T extends Record<string, any>>(formData: FormData): Partial<T> {
  const data: Partial<T> = {}

  for (const [key, value] of formData.entries()) {
    // Handle multiple values for same key (checkboxes, multi-select)
    if (key in data) {
      const existing = data[key as keyof T]
      if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        data[key as keyof T] = [existing, value] as any
      }
    } else {
      data[key as keyof T] = value as any
    }
  }

  return data
}

/**
 * Create a type-safe form submission handler for Remix actions
 *
 * @example
 * ```typescript
 * export const action = createFormAction(async (data: LoginData) => {
 *   const user = await loginUser(data)
 *   return redirect('/dashboard')
 * }, {
 *   validate: (data) => {
 *     if (!data.email) return { error: 'Email required' }
 *     return null
 *   }
 * })
 * ```
 */
export function createFormAction<T, R = any>(
  handler: (data: T) => Promise<R>,
  options: {
    validate?: (data: T) => { error: string } | null
    transform?: (formData: FormData) => T
    onError?: (error: unknown) => any
  } = {}
) {
  return async ({
    request,
  }: {
    request: Request
  }): Promise<R | { error: string }> => {
    try {
      const formData = await request.formData()

      // Transform FormData to typed object
      let data: T
      if (options.transform) {
        data = options.transform(formData)
      } else {
        data = Object.fromEntries(formData) as T
      }

      // Validate
      if (options.validate) {
        const validationError = options.validate(data)
        if (validationError) {
          return validationError
        }
      }

      // Execute handler
      return await handler(data)
    } catch (error) {
      if (options.onError) {
        return options.onError(error)
      }

      const message = error instanceof Error ? error.message : "An error occurred"
      return { error: message }
    }
  }
}



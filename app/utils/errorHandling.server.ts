/**
 * Server-side Error Handling Utilities
 * 
 * This module provides server-specific error handling utilities for API routes,
 * loaders, and actions in the Voodoo Perfumes application.
 */

import { redirect } from 'react-router'

import { AppError, createError, createErrorResponse, ErrorHandler, type ErrorType } from './errorHandling'

// Server Error Response Types
export interface ServerErrorResponse {
  success: false
  error: {
    code: string
    message: string
    type: ErrorType
    severity: string
  }
  redirect?: string
}

export interface ServerSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
}

// Server Error Handler
export class ServerErrorHandler {

  /**
   * Handle errors in server-side functions (loaders, actions)
   */
  static handle(error: unknown, context?: Record<string, any>, userId?: string): AppError {
    return ErrorHandler.handle(error, { ...context, server: true }, userId)
  }

  /**
   * Create a standardized error response for API routes
   */
  static createErrorResponse(error: AppError, status?: number): Response {
    return createErrorResponse(error, status)
  }

  /**
   * Create a success response for API routes
   */
  static createSuccessResponse<T>(data?: T, message?: string): Response {
    return new Response(
      JSON.stringify({
        success: true,
        data,
        message
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  /**
   * Handle errors in loaders with proper error boundaries
   */
  static handleLoaderError(error: unknown, context?: Record<string, any>): never {
    const appError = this.handle(error, { ...context, loader: true })

    // For critical errors, redirect to error page
    if (appError.severity === 'CRITICAL') {
      throw redirect('/error?type=critical')
    }

    // For authentication errors, redirect to login
    if (appError.type === 'AUTHENTICATION') {
      throw redirect('/sign-in?error=auth_required')
    }

    // For authorization errors, redirect to unauthorized page
    if (appError.type === 'AUTHORIZATION') {
      throw redirect('/unauthorized')
    }

    // For other errors, throw the error to be caught by error boundary
    throw appError
  }

  /**
   * Handle errors in actions with proper form error responses
   */
  static handleActionError(error: unknown, context?: Record<string, any>): { error: string } {
    const appError = this.handle(error, { ...context, action: true })
    return { error: appError.userMessage }
  }

  /**
   * Wrap async functions with error handling
   */
  static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ) {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args)
      } catch (error) {
        throw this.handle(error, context)
      }
    }
  }

  /**
   * Wrap sync functions with error handling
   */
  static wrapSync<T extends any[], R>(
    fn: (...args: T) => R,
    context?: Record<string, any>
  ) {
    return (...args: T): R => {
      try {
        return fn(...args)
      } catch (error) {
        throw this.handle(error, context)
      }
    }
  }
}

// Database Error Handler
export class DatabaseErrorHandler {

  /**
   * Handle database-specific errors
   */
  static handle(error: unknown, operation: string, context?: Record<string, any>): AppError {
    const dbContext = {
      ...context,
      database: true,
      operation,
      timestamp: new Date().toISOString()
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      // Handle specific database errors
      if (message.includes('unique constraint') || message.includes('duplicate key')) {
        return createError.validation(
          'A record with this information already exists',
          dbContext
        )
      }

      if (message.includes('foreign key') || message.includes('constraint')) {
        return createError.validation(
          'Cannot perform this operation due to data constraints',
          dbContext
        )
      }

      if (message.includes('not found') || message.includes('does not exist')) {
        return createError.notFound(
          'The requested record was not found',
          dbContext
        )
      }

      if (message.includes('connection') || message.includes('timeout')) {
        return createError.database(
          'Database connection error. Please try again later.',
          dbContext
        )
      }

      if (message.includes('permission') || message.includes('access denied')) {
        return createError.authorization(
          'You do not have permission to perform this database operation',
          dbContext
        )
      }
    }

    return createError.database(
      'Database operation failed',
      dbContext
    )
  }
}

// Authentication Error Handler
export class AuthErrorHandler {

  /**
   * Handle authentication-specific errors
   */
  static handle(error: unknown, context?: Record<string, any>): AppError {
    const authContext = {
      ...context,
      authentication: true,
      timestamp: new Date().toISOString()
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      if (message.includes('invalid credentials') || message.includes('wrong password')) {
        return createError.authentication(
          'Invalid email or password',
          authContext
        )
      }

      if (message.includes('user not found') || message.includes('email not found')) {
        return createError.authentication(
          'No account found with this email address',
          authContext
        )
      }

      if (message.includes('account disabled') || message.includes('account locked')) {
        return createError.authentication(
          'Your account has been disabled. Please contact support.',
          authContext
        )
      }

      if (message.includes('email not verified') || message.includes('verification')) {
        return createError.authentication(
          'Please verify your email address before signing in',
          authContext
        )
      }

      if (message.includes('session expired') || message.includes('token expired')) {
        return createError.authentication(
          'Your session has expired. Please sign in again.',
          authContext
        )
      }
    }

    return createError.authentication(
      'Authentication failed',
      authContext
    )
  }
}

// Validation Error Handler
export class ValidationErrorHandler {

  /**
   * Handle validation-specific errors
   */
  static handle(error: unknown, context?: Record<string, any>): AppError {
    const validationContext = {
      ...context,
      validation: true,
      timestamp: new Date().toISOString()
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      if (message.includes('required') || message.includes('missing')) {
        return createError.validation(
          'Please fill in all required fields',
          validationContext
        )
      }

      if (message.includes('invalid email') || message.includes('email format')) {
        return createError.validation(
          'Please enter a valid email address',
          validationContext
        )
      }

      if (message.includes('password') && message.includes('weak')) {
        return createError.validation(
          'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers',
          validationContext
        )
      }

      if (message.includes('too long') || message.includes('exceeds length')) {
        return createError.validation(
          'Input is too long. Please shorten your text.',
          validationContext
        )
      }

      if (message.includes('too short') || message.includes('minimum length')) {
        return createError.validation(
          'Input is too short. Please provide more information.',
          validationContext
        )
      }
    }

    return createError.validation(
      'Please check your input and try again',
      validationContext
    )
  }
}

// Utility Functions
export const isServerError = (error: unknown): error is AppError => error instanceof AppError

export const getServerErrorMessage = (error: unknown): string => {
  if (isServerError(error)) {
    return error.userMessage
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected server error occurred'
}

export const getServerErrorCode = (error: unknown): string => {
  if (isServerError(error)) {
    return error.code
  }
  return 'SERVER_ERROR'
}

// Error Page Redirects
export const redirectToErrorPage = (errorType: string, message?: string) => {
  const params = new URLSearchParams()
  params.set('type', errorType)
  if (message) {
    params.set('message', message)
  }
  throw redirect(`/error?${params.toString()}`)
}

export const redirectToLogin = (message?: string) => {
  const params = new URLSearchParams()
  if (message) {
    params.set('error', message)
  }
  throw redirect(`/sign-in?${params.toString()}`)
}

export const redirectToUnauthorized = () => {
  throw redirect('/unauthorized')
}

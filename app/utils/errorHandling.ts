/**
 * Centralized Error Handling Utilities
 * 
 * This module provides comprehensive error handling utilities for the Voodoo Perfumes application.
 * It includes error types, logging, user-friendly error messages, and error boundary utilities.
 */

// Error Types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Custom Error Classes
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly code: string
  public readonly userMessage: string
  public readonly context?: Record<string, any>
  public readonly timestamp: Date
  public readonly isOperational: boolean

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code: string = 'UNKNOWN_ERROR',
    userMessage?: string,
    context?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.code = code
    this.userMessage = userMessage || this.getDefaultUserMessage(type)
    this.context = context
    this.timestamp = new Date()
    this.isOperational = isOperational

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.VALIDATION]: 'Please check your input and try again.',
      [ErrorType.AUTHENTICATION]: 'Please sign in to continue.',
      [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
      [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorType.NETWORK]: 'Network error. Please check your connection and try again.',
      [ErrorType.DATABASE]: 'Database error. Please try again later.',
      [ErrorType.SERVER]: 'Server error. Please try again later.',
      [ErrorType.CLIENT]: 'An error occurred. Please try again.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    }
    return messages[type] || messages[ErrorType.UNKNOWN]
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
      stack: this.stack
    }
  }
}

// Error Factory Functions
export const createError = {
  validation: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.VALIDATION, ErrorSeverity.LOW, 'VALIDATION_ERROR', undefined, context),

  authentication: (message: string = 'Authentication failed', context?: Record<string, any>) =>
    new AppError(message, ErrorType.AUTHENTICATION, ErrorSeverity.MEDIUM, 'AUTH_ERROR', undefined, context),

  authorization: (message: string = 'Access denied', context?: Record<string, any>) =>
    new AppError(message, ErrorType.AUTHORIZATION, ErrorSeverity.MEDIUM, 'AUTHZ_ERROR', undefined, context),

  notFound: (resource: string = 'Resource', context?: Record<string, any>) =>
    new AppError(`${resource} not found`, ErrorType.NOT_FOUND, ErrorSeverity.LOW, 'NOT_FOUND_ERROR', undefined, context),

  network: (message: string = 'Network error', context?: Record<string, any>) =>
    new AppError(message, ErrorType.NETWORK, ErrorSeverity.MEDIUM, 'NETWORK_ERROR', undefined, context),

  database: (message: string = 'Database error', context?: Record<string, any>) =>
    new AppError(message, ErrorType.DATABASE, ErrorSeverity.HIGH, 'DB_ERROR', undefined, context),

  server: (message: string = 'Server error', context?: Record<string, any>) =>
    new AppError(message, ErrorType.SERVER, ErrorSeverity.HIGH, 'SERVER_ERROR', undefined, context),

  client: (message: string = 'Client error', context?: Record<string, any>) =>
    new AppError(message, ErrorType.CLIENT, ErrorSeverity.MEDIUM, 'CLIENT_ERROR', undefined, context),

  unknown: (message: string = 'Unknown error', context?: Record<string, any>) =>
    new AppError(message, ErrorType.UNKNOWN, ErrorSeverity.MEDIUM, 'UNKNOWN_ERROR', undefined, context)
}

// Error Logger
export class ErrorLogger {
  private static instance: ErrorLogger
  private logs: Array<{ error: AppError; timestamp: Date; userId?: string }> = []

  private constructor() { }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  log(error: AppError, userId?: string): void {
    const logEntry = { error, timestamp: new Date(), userId }
    this.logs.push(logEntry)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', error.toJSON())
    }

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(error, userId)
    }
  }

  private sendToExternalLogger(error: AppError, userId?: string): void {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.
    console.error('Production error:', error.toJSON())
  }

  getLogs(limit?: number): Array<{ error: AppError; timestamp: Date; userId?: string }> {
    return limit ? this.logs.slice(-limit) : this.logs
  }

  clearLogs(): void {
    this.logs = []
  }
}

// Error Handler
export class ErrorHandler {
  private static logger = ErrorLogger.getInstance()

  static handle(error: unknown, context?: Record<string, any>, userId?: string): AppError {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error instanceof Error) {
      appError = this.convertToAppError(error, context)
    } else {
      appError = createError.unknown(
        typeof error === 'string' ? error : 'An unknown error occurred',
        context
      )
    }

    // Log the error
    this.logger.log(appError, userId)

    return appError
  }

  private static convertToAppError(error: Error, context?: Record<string, any>): AppError {
    const message = error.message
    const contextWithStack = { ...context, originalStack: error.stack }

    // Check for specific error patterns
    if (message.includes('JWT_SECRET') || message.includes('SESSION_SECRET')) {
      return createError.server('Server configuration error', contextWithStack)
    }

    if (message.includes('DATABASE_URL') || message.includes('connection')) {
      return createError.database('Database connection error', contextWithStack)
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return createError.validation(message, contextWithStack)
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return createError.authentication(message, contextWithStack)
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return createError.authorization(message, contextWithStack)
    }

    if (message.includes('not found') || message.includes('404')) {
      return createError.notFound(message, contextWithStack)
    }

    if (message.includes('network') || message.includes('fetch')) {
      return createError.network(message, contextWithStack)
    }

    // Default to server error for unhandled cases
    return createError.server(message, contextWithStack)
  }
}

// Error Response Utilities
export const createErrorResponse = (error: AppError, status?: number) => {
  const statusCode = status || getStatusCodeForErrorType(error.type)

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.userMessage,
        type: error.type,
        severity: error.severity
      }
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

const getStatusCodeForErrorType = (type: ErrorType): number => {
  const statusCodes = {
    [ErrorType.VALIDATION]: 400,
    [ErrorType.AUTHENTICATION]: 401,
    [ErrorType.AUTHORIZATION]: 403,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.NETWORK]: 408,
    [ErrorType.DATABASE]: 500,
    [ErrorType.SERVER]: 500,
    [ErrorType.CLIENT]: 400,
    [ErrorType.UNKNOWN]: 500
  }
  return statusCodes[type] || 500
}

// Error Boundary Utilities
export interface ErrorBoundaryState {
  hasError: boolean
  error?: AppError
  errorId?: string
}

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: AppError, errorId: string) => React.ReactNode
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void
}

// Utility Functions
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError
}

export const getErrorMessage = (error: unknown): string => {
  if (isAppError(error)) {
    return error.userMessage
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export const getErrorCode = (error: unknown): string => {
  if (isAppError(error)) {
    return error.code
  }
  return 'UNKNOWN_ERROR'
}

export const getErrorType = (error: unknown): ErrorType => {
  if (isAppError(error)) {
    return error.type
  }
  return ErrorType.UNKNOWN
}

// Async Error Wrapper
export const asyncErrorHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      throw ErrorHandler.handle(error, context)
    }
  }
}

// Sync Error Wrapper
export const syncErrorHandler = <T extends any[], R>(
  fn: (...args: T) => R,
  context?: Record<string, any>
) => {
  return (...args: T): R => {
    try {
      return fn(...args)
    } catch (error) {
      throw ErrorHandler.handle(error, context)
    }
  }
}

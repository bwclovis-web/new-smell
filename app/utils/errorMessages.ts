/**
 * User-friendly error messages with recovery suggestions
 *
 * This module provides comprehensive, user-friendly error messages
 * that include helpful suggestions for error recovery.
 */

import type { AppError, ErrorType } from "./errorHandling"

export interface ErrorMessage {
  title: string
  message: string
  suggestion: string
  action?: string
  actionText?: string
}

/**
 * Map of error codes to user-friendly messages with recovery suggestions
 */
export const USER_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Authentication Errors
  AUTH_ERROR: {
    title: "Authentication Required",
    message: "You need to be signed in to access this page.",
    suggestion: "Please sign in to continue.",
    action: "/sign-in",
    actionText: "Sign In",
  },
  AUTH_INVALID_CREDENTIALS: {
    title: "Invalid Credentials",
    message: "The email or password you entered is incorrect.",
    suggestion: "Please check your credentials and try again.",
    action: "retry",
    actionText: "Try Again",
  },
  AUTH_SESSION_EXPIRED: {
    title: "Session Expired",
    message: "Your session has expired for security reasons.",
    suggestion: "Please sign in again to continue.",
    action: "/sign-in",
    actionText: "Sign In",
  },
  AUTH_TOKEN_INVALID: {
    title: "Invalid Token",
    message: "Your authentication token is invalid or has expired.",
    suggestion: "Please sign in again to continue.",
    action: "/sign-in",
    actionText: "Sign In",
  },

  // Authorization Errors
  AUTHZ_ERROR: {
    title: "Access Denied",
    message: "You don't have permission to access this resource.",
    suggestion: "If you believe this is an error, please contact support.",
    action: "/",
    actionText: "Go Home",
  },
  AUTHZ_INSUFFICIENT_PERMISSIONS: {
    title: "Insufficient Permissions",
    message: "Your account does not have the required permissions for this action.",
    suggestion: "Please contact an administrator if you need access.",
    action: "/",
    actionText: "Go Home",
  },
  AUTHZ_ADMIN_ONLY: {
    title: "Admin Access Required",
    message: "This feature is only available to administrators.",
    suggestion: "Please contact an administrator if you need access.",
    action: "/",
    actionText: "Go Home",
  },

  // Validation Errors
  VALIDATION_ERROR: {
    title: "Invalid Input",
    message: "Please check your input and try again.",
    suggestion: "Make sure all required fields are filled in correctly.",
  },
  VALIDATION_MISSING_FIELD: {
    title: "Missing Required Field",
    message: "One or more required fields are missing.",
    suggestion: "Please fill in all required fields and try again.",
  },
  VALIDATION_INVALID_FORMAT: {
    title: "Invalid Format",
    message: "One or more fields contain invalid data.",
    suggestion: "Please check the format of your input and try again.",
  },
  VALIDATION_PASSWORD_WEAK: {
    title: "Weak Password",
    message: "Your password does not meet the security requirements.",
    suggestion:
      "Use at least 8 characters with a mix of letters, numbers, and symbols.",
  },
  VALIDATION_EMAIL_INVALID: {
    title: "Invalid Email",
    message: "The email address you entered is not valid.",
    suggestion: "Please enter a valid email address.",
  },

  // Database Errors
  DB_ERROR: {
    title: "Database Error",
    message: "We're having trouble connecting to our servers.",
    suggestion:
      "Please try again in a few moments. If the problem persists, contact support.",
    action: "retry",
    actionText: "Try Again",
  },
  DB_CONNECTION_ERROR: {
    title: "Connection Error",
    message: "Unable to connect to the database.",
    suggestion:
      "Please try again in a few moments. If the problem persists, contact support.",
    action: "retry",
    actionText: "Try Again",
  },
  DB_QUERY_ERROR: {
    title: "Query Error",
    message: "An error occurred while processing your request.",
    suggestion: "Please try again. If the problem persists, contact support.",
    action: "retry",
    actionText: "Try Again",
  },
  DB_CONSTRAINT_ERROR: {
    title: "Duplicate Entry",
    message: "This record already exists in the database.",
    suggestion: "Please use a different value or update the existing record.",
  },
  DB_NOT_FOUND: {
    title: "Record Not Found",
    message: "The requested record could not be found.",
    suggestion: "It may have been deleted or moved. Please try refreshing the page.",
    action: "retry",
    actionText: "Refresh",
  },

  // Network Errors
  NETWORK_ERROR: {
    title: "Connection Error",
    message: "We couldn't connect to our servers.",
    suggestion: "Please check your internet connection and try again.",
    action: "retry",
    actionText: "Retry",
  },
  NETWORK_TIMEOUT: {
    title: "Request Timeout",
    message: "The request took too long to complete.",
    suggestion: "Please check your internet connection and try again.",
    action: "retry",
    actionText: "Retry",
  },
  NETWORK_OFFLINE: {
    title: "No Internet Connection",
    message: "You appear to be offline.",
    suggestion: "Please check your internet connection and try again.",
    action: "retry",
    actionText: "Retry",
  },

  // Not Found Errors
  NOT_FOUND_ERROR: {
    title: "Not Found",
    message: "The page or resource you're looking for doesn't exist.",
    suggestion: "It may have been moved or deleted.",
    action: "/",
    actionText: "Go Home",
  },
  NOT_FOUND_PERFUME: {
    title: "Perfume Not Found",
    message: "We couldn't find the perfume you're looking for.",
    suggestion: "It may have been removed from our catalog.",
    action: "/perfumes",
    actionText: "Browse Perfumes",
  },
  NOT_FOUND_USER: {
    title: "User Not Found",
    message: "We couldn't find the user you're looking for.",
    suggestion: "The user may have deleted their account.",
    action: "/",
    actionText: "Go Home",
  },

  // Server Errors
  SERVER_ERROR: {
    title: "Server Error",
    message: "Something went wrong on our end.",
    suggestion: "We're working on fixing it. Please try again later.",
    action: "retry",
    actionText: "Try Again",
  },
  SERVER_INTERNAL_ERROR: {
    title: "Internal Server Error",
    message: "An unexpected error occurred on our servers.",
    suggestion:
      "We've been notified and are working on a fix. Please try again later.",
    action: "retry",
    actionText: "Try Again",
  },
  SERVER_SERVICE_UNAVAILABLE: {
    title: "Service Unavailable",
    message: "This service is temporarily unavailable.",
    suggestion: "We're performing maintenance. Please try again later.",
    action: "retry",
    actionText: "Try Again",
  },
  SERVER_RATE_LIMIT: {
    title: "Too Many Requests",
    message: "You've made too many requests in a short time.",
    suggestion: "Please wait a few moments before trying again.",
    action: "retry",
    actionText: "Try Again",
  },

  // File Upload Errors
  FILE_TOO_LARGE: {
    title: "File Too Large",
    message: "The file you selected is too large to upload.",
    suggestion: "Please select a smaller file (maximum 5MB).",
  },
  FILE_INVALID_TYPE: {
    title: "Invalid File Type",
    message: "The file type you selected is not supported.",
    suggestion: "Please select a valid file type (JPEG, PNG, GIF).",
  },

  // API Errors
  API_ERROR: {
    title: "API Error",
    message: "An error occurred while communicating with the API.",
    suggestion: "Please try again. If the problem persists, contact support.",
    action: "retry",
    actionText: "Try Again",
  },
  API_INVALID_RESPONSE: {
    title: "Invalid Response",
    message: "The server returned an unexpected response.",
    suggestion: "Please try again. If the problem persists, contact support.",
    action: "retry",
    actionText: "Try Again",
  },

  // Generic Errors
  UNKNOWN_ERROR: {
    title: "Unexpected Error",
    message: "Something unexpected happened.",
    suggestion: "Please try again. If the problem continues, contact support.",
    action: "retry",
    actionText: "Try Again",
  },
  CLIENT_ERROR: {
    title: "Client Error",
    message: "An error occurred in your browser.",
    suggestion: "Please refresh the page and try again.",
    action: "retry",
    actionText: "Refresh",
  },
}

/**
 * Get user-friendly error message with recovery suggestions based on error code
 */
export function getUserErrorMessage(error: AppError | string): ErrorMessage {
  const code = typeof error === "string" ? error : error.code

  // Return specific error message if available
  if (USER_ERROR_MESSAGES[code]) {
    return USER_ERROR_MESSAGES[code]
  }

  // Fall back to error type-based messages
  if (typeof error !== "string" && error.type) {
    return getErrorMessageByType(error.type)
  }

  // Fall back to generic error
  return USER_ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessageByType(type: ErrorType): ErrorMessage {
  switch (type) {
    case "AUTHENTICATION":
      return USER_ERROR_MESSAGES.AUTH_ERROR
    case "AUTHORIZATION":
      return USER_ERROR_MESSAGES.AUTHZ_ERROR
    case "VALIDATION":
      return USER_ERROR_MESSAGES.VALIDATION_ERROR
    case "DATABASE":
      return USER_ERROR_MESSAGES.DB_ERROR
    case "NETWORK":
      return USER_ERROR_MESSAGES.NETWORK_ERROR
    case "NOT_FOUND":
      return USER_ERROR_MESSAGES.NOT_FOUND_ERROR
    case "SERVER":
      return USER_ERROR_MESSAGES.SERVER_ERROR
    case "CLIENT":
      return USER_ERROR_MESSAGES.CLIENT_ERROR
    default:
      return USER_ERROR_MESSAGES.UNKNOWN_ERROR
  }
}

/**
 * Get recovery action URL from error message
 */
export function getRecoveryAction(errorMessage: ErrorMessage): string | null {
  if (!errorMessage.action) {
    return null
  }

  // If action is 'retry', return null (handled by retry button)
  if (errorMessage.action === "retry") {
    return null
  }

  return errorMessage.action
}

/**
 * Check if error is retryable based on error message
 */
export function isRetryableError(errorMessage: ErrorMessage): boolean {
  return errorMessage.action === "retry"
}

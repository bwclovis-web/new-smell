import { describe, expect, it } from 'vitest'

import { AppError, createError } from '~/utils/errorHandling'
import {
  getUserErrorMessage,
  getErrorMessageByType,
  getRecoveryAction,
  isRetryableError,
  USER_ERROR_MESSAGES,
  type ErrorMessage,
} from '~/utils/errorMessages'

describe('errorMessages', () => {
  describe('USER_ERROR_MESSAGES', () => {
    it('should have all required authentication error messages', () => {
      expect(USER_ERROR_MESSAGES.AUTH_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.AUTH_ERROR.title).toBe('Authentication Required')
      expect(USER_ERROR_MESSAGES.AUTH_ERROR.action).toBe('/sign-in')
      expect(USER_ERROR_MESSAGES.AUTH_ERROR.actionText).toBe('Sign In')
      
      expect(USER_ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS).toBeDefined()
      expect(USER_ERROR_MESSAGES.AUTH_SESSION_EXPIRED).toBeDefined()
      expect(USER_ERROR_MESSAGES.AUTH_TOKEN_INVALID).toBeDefined()
    })

    it('should have all required authorization error messages', () => {
      expect(USER_ERROR_MESSAGES.AUTHZ_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.AUTHZ_ERROR.title).toBe('Access Denied')
      expect(USER_ERROR_MESSAGES.AUTHZ_ERROR.action).toBe('/')
      
      expect(USER_ERROR_MESSAGES.AUTHZ_INSUFFICIENT_PERMISSIONS).toBeDefined()
      expect(USER_ERROR_MESSAGES.AUTHZ_ADMIN_ONLY).toBeDefined()
    })

    it('should have all required validation error messages', () => {
      expect(USER_ERROR_MESSAGES.VALIDATION_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.VALIDATION_ERROR.title).toBe('Invalid Input')
      
      expect(USER_ERROR_MESSAGES.VALIDATION_MISSING_FIELD).toBeDefined()
      expect(USER_ERROR_MESSAGES.VALIDATION_INVALID_FORMAT).toBeDefined()
      expect(USER_ERROR_MESSAGES.VALIDATION_PASSWORD_WEAK).toBeDefined()
      expect(USER_ERROR_MESSAGES.VALIDATION_EMAIL_INVALID).toBeDefined()
    })

    it('should have all required database error messages', () => {
      expect(USER_ERROR_MESSAGES.DB_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.DB_ERROR.title).toBe('Database Error')
      expect(USER_ERROR_MESSAGES.DB_ERROR.action).toBe('retry')
      
      expect(USER_ERROR_MESSAGES.DB_CONNECTION_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.DB_QUERY_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.DB_CONSTRAINT_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.DB_NOT_FOUND).toBeDefined()
    })

    it('should have all required network error messages', () => {
      expect(USER_ERROR_MESSAGES.NETWORK_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.NETWORK_ERROR.title).toBe('Connection Error')
      expect(USER_ERROR_MESSAGES.NETWORK_ERROR.action).toBe('retry')
      
      expect(USER_ERROR_MESSAGES.NETWORK_TIMEOUT).toBeDefined()
      expect(USER_ERROR_MESSAGES.NETWORK_OFFLINE).toBeDefined()
    })

    it('should have all required not found error messages', () => {
      expect(USER_ERROR_MESSAGES.NOT_FOUND_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.NOT_FOUND_ERROR.title).toBe('Not Found')
      expect(USER_ERROR_MESSAGES.NOT_FOUND_ERROR.action).toBe('/')
      
      expect(USER_ERROR_MESSAGES.NOT_FOUND_PERFUME).toBeDefined()
      expect(USER_ERROR_MESSAGES.NOT_FOUND_USER).toBeDefined()
    })

    it('should have all required server error messages', () => {
      expect(USER_ERROR_MESSAGES.SERVER_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.SERVER_ERROR.title).toBe('Server Error')
      expect(USER_ERROR_MESSAGES.SERVER_ERROR.action).toBe('retry')
      
      expect(USER_ERROR_MESSAGES.SERVER_INTERNAL_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.SERVER_SERVICE_UNAVAILABLE).toBeDefined()
      expect(USER_ERROR_MESSAGES.SERVER_RATE_LIMIT).toBeDefined()
    })

    it('should have file upload error messages', () => {
      expect(USER_ERROR_MESSAGES.FILE_TOO_LARGE).toBeDefined()
      expect(USER_ERROR_MESSAGES.FILE_INVALID_TYPE).toBeDefined()
    })

    it('should have API error messages', () => {
      expect(USER_ERROR_MESSAGES.API_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.API_INVALID_RESPONSE).toBeDefined()
    })

    it('should have generic error messages', () => {
      expect(USER_ERROR_MESSAGES.UNKNOWN_ERROR).toBeDefined()
      expect(USER_ERROR_MESSAGES.CLIENT_ERROR).toBeDefined()
    })

    it('should have all required fields for each error message', () => {
      Object.entries(USER_ERROR_MESSAGES).forEach(([code, message]) => {
        expect(message.title).toBeDefined()
        expect(message.title).not.toBe('')
        expect(message.message).toBeDefined()
        expect(message.message).not.toBe('')
        expect(message.suggestion).toBeDefined()
        expect(message.suggestion).not.toBe('')
        // action and actionText are optional
      })
    })
  })

  describe('getUserErrorMessage', () => {
    it('should return specific error message for known error code', () => {
      const error = createError.authentication('Invalid credentials')
      error.code = 'AUTH_INVALID_CREDENTIALS'
      
      const result = getUserErrorMessage(error)
      
      expect(result).toBe(USER_ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS)
      expect(result.title).toBe('Invalid Credentials')
      expect(result.message).toBe('The email or password you entered is incorrect.')
    })

    it('should return error message by type if code not found', () => {
      const error = createError.authentication('Unknown auth error')
      
      const result = getUserErrorMessage(error)
      
      expect(result).toBe(USER_ERROR_MESSAGES.AUTH_ERROR)
      expect(result.title).toBe('Authentication Required')
    })

    it('should return UNKNOWN_ERROR for completely unknown errors', () => {
      const error = new AppError({
        code: 'COMPLETELY_UNKNOWN_ERROR',
        message: 'This is unknown',
        type: 'UNKNOWN' as any,
        severity: 'MEDIUM',
      })
      
      const result = getUserErrorMessage(error)
      
      expect(result).toBe(USER_ERROR_MESSAGES.UNKNOWN_ERROR)
      expect(result.title).toBe('Unexpected Error')
    })

    it('should handle string error codes', () => {
      const result = getUserErrorMessage('AUTH_ERROR')
      
      expect(result).toBe(USER_ERROR_MESSAGES.AUTH_ERROR)
      expect(result.title).toBe('Authentication Required')
    })

    it('should handle string error codes not in the map', () => {
      const result = getUserErrorMessage('UNKNOWN_CODE_123')
      
      expect(result).toBe(USER_ERROR_MESSAGES.UNKNOWN_ERROR)
    })

    it('should return correct message for validation errors', () => {
      const error = createError.validation('Invalid input', {
        field: 'email',
      })
      error.code = 'VALIDATION_EMAIL_INVALID'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('Invalid Email')
      expect(result.message).toBe('The email address you entered is not valid.')
      expect(result.suggestion).toBe('Please enter a valid email address.')
    })

    it('should return correct message for database errors', () => {
      const error = createError.database('Connection timeout')
      error.code = 'DB_CONNECTION_ERROR'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('Connection Error')
      expect(result.action).toBe('retry')
      expect(result.actionText).toBe('Try Again')
    })

    it('should return correct message for network errors', () => {
      const error = createError.network('Request timeout')
      error.code = 'NETWORK_TIMEOUT'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('Request Timeout')
      expect(result.action).toBe('retry')
      expect(result.actionText).toBe('Retry')
    })

    it('should return correct message for not found errors', () => {
      const error = createError.notFound('Perfume not found')
      error.code = 'NOT_FOUND_PERFUME'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('Perfume Not Found')
      expect(result.action).toBe('/perfumes')
      expect(result.actionText).toBe('Browse Perfumes')
    })
  })

  describe('getErrorMessageByType', () => {
    it('should return AUTH_ERROR for AUTHENTICATION type', () => {
      const result = getErrorMessageByType('AUTHENTICATION')
      
      expect(result).toBe(USER_ERROR_MESSAGES.AUTH_ERROR)
    })

    it('should return AUTHZ_ERROR for AUTHORIZATION type', () => {
      const result = getErrorMessageByType('AUTHORIZATION')
      
      expect(result).toBe(USER_ERROR_MESSAGES.AUTHZ_ERROR)
    })

    it('should return VALIDATION_ERROR for VALIDATION type', () => {
      const result = getErrorMessageByType('VALIDATION')
      
      expect(result).toBe(USER_ERROR_MESSAGES.VALIDATION_ERROR)
    })

    it('should return DB_ERROR for DATABASE type', () => {
      const result = getErrorMessageByType('DATABASE')
      
      expect(result).toBe(USER_ERROR_MESSAGES.DB_ERROR)
    })

    it('should return NETWORK_ERROR for NETWORK type', () => {
      const result = getErrorMessageByType('NETWORK')
      
      expect(result).toBe(USER_ERROR_MESSAGES.NETWORK_ERROR)
    })

    it('should return NOT_FOUND_ERROR for NOT_FOUND type', () => {
      const result = getErrorMessageByType('NOT_FOUND')
      
      expect(result).toBe(USER_ERROR_MESSAGES.NOT_FOUND_ERROR)
    })

    it('should return SERVER_ERROR for SERVER type', () => {
      const result = getErrorMessageByType('SERVER')
      
      expect(result).toBe(USER_ERROR_MESSAGES.SERVER_ERROR)
    })

    it('should return CLIENT_ERROR for CLIENT type', () => {
      const result = getErrorMessageByType('CLIENT')
      
      expect(result).toBe(USER_ERROR_MESSAGES.CLIENT_ERROR)
    })

    it('should return UNKNOWN_ERROR for UNKNOWN type', () => {
      const result = getErrorMessageByType('UNKNOWN')
      
      expect(result).toBe(USER_ERROR_MESSAGES.UNKNOWN_ERROR)
    })

    it('should return UNKNOWN_ERROR for undefined type', () => {
      const result = getErrorMessageByType(undefined as any)
      
      expect(result).toBe(USER_ERROR_MESSAGES.UNKNOWN_ERROR)
    })
  })

  describe('getRecoveryAction', () => {
    it('should return action URL when action is a path', () => {
      const errorMessage: ErrorMessage = {
        title: 'Test Error',
        message: 'Test message',
        suggestion: 'Test suggestion',
        action: '/sign-in',
        actionText: 'Sign In',
      }
      
      const result = getRecoveryAction(errorMessage)
      
      expect(result).toBe('/sign-in')
    })

    it('should return null when action is retry', () => {
      const errorMessage: ErrorMessage = {
        title: 'Test Error',
        message: 'Test message',
        suggestion: 'Test suggestion',
        action: 'retry',
        actionText: 'Try Again',
      }
      
      const result = getRecoveryAction(errorMessage)
      
      expect(result).toBeNull()
    })

    it('should return null when action is undefined', () => {
      const errorMessage: ErrorMessage = {
        title: 'Test Error',
        message: 'Test message',
        suggestion: 'Test suggestion',
      }
      
      const result = getRecoveryAction(errorMessage)
      
      expect(result).toBeNull()
    })

    it('should return action URL for home path', () => {
      const errorMessage: ErrorMessage = {
        title: 'Test Error',
        message: 'Test message',
        suggestion: 'Test suggestion',
        action: '/',
        actionText: 'Go Home',
      }
      
      const result = getRecoveryAction(errorMessage)
      
      expect(result).toBe('/')
    })
  })

  describe('isRetryableError', () => {
    it('should return true when action is retry', () => {
      const errorMessage: ErrorMessage = {
        title: 'Test Error',
        message: 'Test message',
        suggestion: 'Test suggestion',
        action: 'retry',
        actionText: 'Try Again',
      }
      
      const result = isRetryableError(errorMessage)
      
      expect(result).toBe(true)
    })

    it('should return false when action is a URL', () => {
      const errorMessage: ErrorMessage = {
        title: 'Test Error',
        message: 'Test message',
        suggestion: 'Test suggestion',
        action: '/sign-in',
        actionText: 'Sign In',
      }
      
      const result = isRetryableError(errorMessage)
      
      expect(result).toBe(false)
    })

    it('should return false when action is undefined', () => {
      const errorMessage: ErrorMessage = {
        title: 'Test Error',
        message: 'Test message',
        suggestion: 'Test suggestion',
      }
      
      const result = isRetryableError(errorMessage)
      
      expect(result).toBe(false)
    })
  })

  describe('Error message completeness', () => {
    it('should have suggestions for all database errors', () => {
      const dbErrorCodes = Object.keys(USER_ERROR_MESSAGES).filter(code => code.startsWith('DB_'))
      
      dbErrorCodes.forEach(code => {
        const message = USER_ERROR_MESSAGES[code]
        expect(message.suggestion).toBeDefined()
        expect(message.suggestion.length).toBeGreaterThan(0)
      })
    })

    it('should have suggestions for all network errors', () => {
      const networkErrorCodes = Object.keys(USER_ERROR_MESSAGES).filter(code => code.startsWith('NETWORK_'))
      
      networkErrorCodes.forEach(code => {
        const message = USER_ERROR_MESSAGES[code]
        expect(message.suggestion).toBeDefined()
        expect(message.suggestion.length).toBeGreaterThan(0)
      })
    })

    it('should have retry action for transient errors', () => {
      const transientErrorCodes = [
        'DB_ERROR',
        'DB_CONNECTION_ERROR',
        'DB_QUERY_ERROR',
        'NETWORK_ERROR',
        'NETWORK_TIMEOUT',
        'NETWORK_OFFLINE',
        'SERVER_ERROR',
        'SERVER_INTERNAL_ERROR',
        'SERVER_SERVICE_UNAVAILABLE',
        'SERVER_RATE_LIMIT',
      ]
      
      transientErrorCodes.forEach(code => {
        const message = USER_ERROR_MESSAGES[code]
        expect(message.action).toBe('retry')
        expect(message.actionText).toBeDefined()
      })
    })

    it('should have navigation action for permanent errors', () => {
      const permanentErrorCodes = [
        'AUTH_ERROR',
        'AUTHZ_ERROR',
        'NOT_FOUND_ERROR',
      ]
      
      permanentErrorCodes.forEach(code => {
        const message = USER_ERROR_MESSAGES[code]
        expect(message.action).toBeDefined()
        expect(message.action).not.toBe('retry')
        expect(message.actionText).toBeDefined()
      })
    })
  })

  describe('Integration with AppError', () => {
    it('should work with authentication errors', () => {
      const error = createError.authentication('Invalid token')
      error.code = 'AUTH_TOKEN_INVALID'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('Invalid Token')
      expect(result.message).toContain('authentication token')
      expect(result.action).toBe('/sign-in')
    })

    it('should work with authorization errors', () => {
      const error = createError.authorization('Admin only')
      error.code = 'AUTHZ_ADMIN_ONLY'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('Admin Access Required')
      expect(result.message).toContain('administrators')
      expect(result.action).toBe('/')
    })

    it('should work with validation errors', () => {
      const error = createError.validation('Weak password')
      error.code = 'VALIDATION_PASSWORD_WEAK'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('Weak Password')
      expect(result.message).toContain('security requirements')
      expect(result.suggestion).toContain('8 characters')
    })

    it('should work with database errors', () => {
      const error = createError.database('Connection failed')
      error.code = 'DB_CONNECTION_ERROR'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('Connection Error')
      expect(result.action).toBe('retry')
      expect(isRetryableError(result)).toBe(true)
    })

    it('should work with network errors', () => {
      const error = createError.network('Offline')
      error.code = 'NETWORK_OFFLINE'
      
      const result = getUserErrorMessage(error)
      
      expect(result.title).toBe('No Internet Connection')
      expect(result.action).toBe('retry')
      expect(isRetryableError(result)).toBe(true)
    })
  })
})


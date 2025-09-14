import { type FC } from 'react'

import { AppError, getErrorMessage, getErrorCode, getErrorType } from '~/utils/errorHandling'

interface ErrorDisplayProps {
  error: unknown
  title?: string
  showDetails?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  variant?: 'inline' | 'card' | 'banner'
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({
  error,
  title,
  showDetails = false,
  onRetry,
  onDismiss,
  className = '',
  variant = 'card'
}) => {
  const message = getErrorMessage(error)
  const code = getErrorCode(error)
  const type = getErrorType(error)
  const isAppError = error instanceof AppError

  const getVariantStyles = () => {
    switch (variant) {
      case 'inline':
        return 'text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2'
      case 'banner':
        return 'bg-red-50 border-l-4 border-red-400 p-4'
      case 'card':
      default:
        return 'bg-white border border-red-200 rounded-lg shadow-sm p-4'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'AUTHENTICATION':
        return '🔐'
      case 'AUTHORIZATION':
        return '🚫'
      case 'VALIDATION':
        return '⚠️'
      case 'NOT_FOUND':
        return '🔍'
      case 'NETWORK':
        return '🌐'
      case 'DATABASE':
        return '🗄️'
      case 'SERVER':
        return '⚙️'
      case 'CLIENT':
        return '💻'
      default:
        return '❌'
    }
  }

  const getTitle = () => {
    if (title) return title

    switch (type) {
      case 'AUTHENTICATION':
        return 'Authentication Error'
      case 'AUTHORIZATION':
        return 'Access Denied'
      case 'VALIDATION':
        return 'Validation Error'
      case 'NOT_FOUND':
        return 'Not Found'
      case 'NETWORK':
        return 'Network Error'
      case 'DATABASE':
        return 'Database Error'
      case 'SERVER':
        return 'Server Error'
      case 'CLIENT':
        return 'Client Error'
      default:
        return 'Error'
    }
  }

  if (variant === 'inline') {
    return (
      <div className={`${getVariantStyles()} ${className}`}>
        <span className="flex items-center">
          <span className="mr-2">{getIcon()}</span>
          {message}
        </span>
      </div>
    )
  }

  return (
    <div className={`${getVariantStyles()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">{getIcon()}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {getTitle()}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          
          {showDetails && isAppError && (
            <div className="mt-3 text-xs text-red-600">
              <p><strong>Error Code:</strong> {code}</p>
              <p><strong>Type:</strong> {type}</p>
              <p><strong>Severity:</strong> {error.severity}</p>
              {error.context && Object.keys(error.context).length > 0 && (
                <p><strong>Context:</strong> {JSON.stringify(error.context, null, 2)}</p>
              )}
            </div>
          )}

          {(onRetry || onDismiss) && (
            <div className="mt-4 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorDisplay

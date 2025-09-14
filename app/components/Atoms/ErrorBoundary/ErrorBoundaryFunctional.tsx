import React, { type ErrorInfo, type ReactNode, useState, useCallback } from 'react'

import { type AppError } from '~/utils/errorHandling'

import ComponentError from './components/ComponentError'
import CriticalError from './components/CriticalError'
import PageError from './components/PageError'
import { generateErrorId, reportError } from './utils/errorUtils'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: AppError, errorId: string) => ReactNode
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: AppError
  errorId?: string
}

// This is a functional component wrapper that can be used as an error boundary
// Note: React doesn't have functional error boundaries yet, so this is a workaround
export const ErrorBoundaryFunctional: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
  onError,
  level = 'component'
}) => {
  const [state, setState] = useState<ErrorBoundaryState>({ hasError: false })
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const handleError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    const appError = {
      message: error.message,
      userMessage: 'Something went wrong. Please try again.',
      code: 'UNKNOWN_ERROR',
      toJSON: () => ({ message: error.message, stack: error.stack })
    } as AppError

    // Call the onError callback if provided
    if (onError) {
      onError(appError, errorInfo)
    }

    // Update state with the handled error
    setState({
      hasError: true,
      error: appError,
      errorId: generateErrorId()
    })
  }, [onError])

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      setState({ hasError: false, error: undefined, errorId: undefined })
    } else {
      // Reset retry count and reload the page
      setRetryCount(0)
      window.location.reload()
    }
  }, [retryCount, maxRetries])

  const handleReportError = useCallback(() => {
    if (state.error && state.errorId) {
      reportError(state.error, state.errorId)
    }
  }, [state.error, state.errorId])

  // This is a workaround - in a real app, you'd use a class component or a library like react-error-boundary
  if (state.hasError && state.error && state.errorId) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback(state.error, state.errorId)}</>
    }

    // Default fallback UI based on level
    if (level === 'critical') {
      return (
        <CriticalError
          error={state.error}
          errorId={state.errorId}
          onRetry={handleRetry}
          onReportError={handleReportError}
        />
      )
    }

    if (level === 'page') {
      return (
        <PageError
          error={state.error}
          errorId={state.errorId}
          onRetry={handleRetry}
          onReportError={handleReportError}
        />
      )
    }

    return (
      <ComponentError
        error={state.error}
        errorId={state.errorId}
        onRetry={handleRetry}
        onReportError={handleReportError}
      />
    )
  }

  return <>{children}</>
}

// For now, we'll keep the class component as the main export
// In the future, when React supports functional error boundaries, we can switch
export { ErrorBoundaryRefactored as ErrorBoundary } from './ErrorBoundaryRefactored'

import { useState, useCallback } from 'react'
import { type ErrorInfo } from 'react'

import { AppError, ErrorHandler } from '~/utils/errorHandling'

import { generateErrorId, handleRetry, reportError } from '../utils/errorUtils'

interface ErrorBoundaryState {
  hasError: boolean
  error?: AppError
  errorId?: string
}

interface UseErrorBoundaryStateProps {
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  maxRetries?: number
}

export const useErrorBoundaryState = ({
  onError,
  maxRetries = 3
}: UseErrorBoundaryStateProps = {}) => {
  const [state, setState] = useState<ErrorBoundaryState>({ hasError: false })
  const [retryCount, setRetryCount] = useState(0)

  const handleError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    const appError = ErrorHandler.handle(error, {
      component: 'ErrorBoundary',
      errorInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundary: errorInfo.errorBoundary
      }
    })

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

  const handleRetryAction = useCallback(() => {
    handleRetry(
      retryCount,
      maxRetries,
      () => {
        setRetryCount(prev => prev + 1)
        setState({ hasError: false, error: undefined, errorId: undefined })
      },
      () => {
        setRetryCount(0)
      }
    )
  }, [retryCount, maxRetries])

  const handleReportErrorAction = useCallback(() => {
    if (state.error && state.errorId) {
      reportError(state.error, state.errorId)
    }
  }, [state.error, state.errorId])

  const resetError = useCallback(() => {
    setState({ hasError: false, error: undefined, errorId: undefined })
    setRetryCount(0)
  }, [])

  return {
    state,
    handleError,
    handleRetryAction,
    handleReportErrorAction,
    resetError,
    retryCount
  }
}

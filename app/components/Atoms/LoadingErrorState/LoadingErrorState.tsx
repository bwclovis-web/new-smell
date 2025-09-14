import { type FC } from 'react'

import ErrorDisplay from '~/components/Atoms/ErrorDisplay'

interface LoadingErrorStateProps {
  isLoading?: boolean
  error?: unknown
  loadingText?: string
  errorTitle?: string
  showErrorDetails?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  children?: React.ReactNode
}

const LoadingErrorState: FC<LoadingErrorStateProps> = ({
  isLoading = false,
  error,
  loadingText = 'Loading...',
  errorTitle,
  showErrorDetails = false,
  onRetry,
  onDismiss,
  className = '',
  children
}) => {
  // Show error state if there's an error
  if (error) {
    return (
      <div className={className}>
        <ErrorDisplay
          error={error}
          title={errorTitle}
          showDetails={showErrorDetails}
          onRetry={onRetry}
          onDismiss={onDismiss}
          variant="card"
        />
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">{loadingText}</p>
        </div>
      </div>
    )
  }

  // Show children if no loading or error state
  return <>{children}</>
}

export default LoadingErrorState

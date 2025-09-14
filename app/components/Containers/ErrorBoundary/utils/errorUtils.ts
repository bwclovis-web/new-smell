import { type AppError } from '~/utils/errorHandling'

export const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const reportError = (error: AppError, errorId: string): void => {
  // In a real app, you would send this to your error reporting service
  console.error('Error reported:', {
    errorId,
    error: error.toJSON()
  })

  // Show user feedback
  alert('Error has been reported. Thank you for your feedback!')
}

export const handleRetry = (
  retryCount: number,
  maxRetries: number,
  onRetry: () => void,
  onMaxRetriesReached: () => void
): void => {
  if (retryCount < maxRetries) {
    onRetry()
  } else {
    // Reset retry count and reload the page
    onMaxRetriesReached()
    window.location.reload()
  }
}

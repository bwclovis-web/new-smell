import React, { Component, type ErrorInfo, type ReactNode } from 'react'

import { type AppError } from '~/utils/errorHandling'

import ComponentError from './components/ComponentError'
import CriticalError from './components/CriticalError'
import PageError from './components/PageError'
import { useErrorBoundaryState } from './hooks/useErrorBoundaryState'

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

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorBoundaryHook: ReturnType<typeof useErrorBoundaryState>

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }

    // Initialize the hook (this is a workaround since hooks can't be used in class components)
    // In a real implementation, you'd want to convert this to a functional component
    this.errorBoundaryHook = useErrorBoundaryState({
      onError: props.onError,
      maxRetries: 3
    })
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error: {
        message: error.message,
        userMessage: 'Something went wrong. Please try again.',
        code: 'UNKNOWN_ERROR',
        toJSON: () => ({ message: error.message, stack: error.stack })
      } as AppError,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Call the onError callback if provided
    if (this.props.onError) {
      const appError = {
        message: error.message,
        userMessage: 'Something went wrong. Please try again.',
        code: 'UNKNOWN_ERROR',
        toJSON: () => ({ message: error.message, stack: error.stack })
      } as AppError

      this.props.onError(appError, errorInfo)
    }

    // Update state with the handled error
    this.setState({
      error: {
        message: error.message,
        userMessage: 'Something went wrong. Please try again.',
        code: 'UNKNOWN_ERROR',
        toJSON: () => ({ message: error.message, stack: error.stack })
      } as AppError,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  private handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      // In a real app, you would send this to your error reporting service
      console.error('Error reported:', {
        errorId: this.state.errorId,
        error: this.state.error.toJSON()
      })

      // Show user feedback
      alert('Error has been reported. Thank you for your feedback!')
    }
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorId)
      }

      // Default fallback UI based on level
      return this.renderDefaultFallback(this.state.error, this.state.errorId)
    }

    return this.props.children
  }

  private renderDefaultFallback(error: AppError, errorId: string) {
    const { level = 'component' } = this.props

    if (level === 'critical') {
      return (
        <CriticalError
          error={error}
          errorId={errorId}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
        />
      )
    }

    if (level === 'page') {
      return (
        <PageError
          error={error}
          errorId={errorId}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
        />
      )
    }

    return (
      <ComponentError
        error={error}
        errorId={errorId}
        onRetry={this.handleRetry}
        onReportError={this.handleReportError}
      />
    )
  }
}

import { cloneElement, forwardRef, type ReactElement, type ReactNode } from 'react'

import ValidationMessage from '../ValidationMessage/ValidationMessage'

export interface FormFieldProps {
  label?: string
  error?: string
  success?: string
  warning?: string
  info?: string
  required?: boolean
  disabled?: boolean
  className?: string
  labelClassName?: string
  fieldClassName?: string
  children: ReactNode
  helpText?: string
  showValidationIcon?: boolean
}
//TODO: Clean up to standards
const FormField = forwardRef<HTMLDivElement, FormFieldProps>((
  {
    label,
    error,
    success,
    warning,
    info,
    required = false,
    disabled = false,
    className = '',
    labelClassName = '',
    fieldClassName = '',
    children,
    helpText,
    showValidationIcon = true
  },
  ref
) => {
  const hasError = !!error
  const hasSuccess = !!success
  const hasWarning = !!warning
  const hasInfo = !!info

  const fieldStateClasses = `
      ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
      ${hasSuccess ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}
      ${hasWarning ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500' : ''}
      ${hasInfo ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500' : ''}
      ${!hasError && !hasSuccess && !hasWarning && !hasInfo ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' : ''}
      ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
    `

  return (
    <div ref={ref} className={`space-y-1 ${className}`}>
      {label && (
        <label
          className={`
              block text-sm font-medium text-gray-700
              ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}
              ${disabled ? 'text-gray-400' : ''}
              ${labelClassName}
            `}
        >
          {label}
        </label>
      )}

      <div className={`relative ${fieldClassName}`}>
        {cloneElement(children as ReactElement, {
          className: `
                ${(children as ReactElement).props.className || ''}
              ${fieldStateClasses}
            `,
          disabled,
          'aria-invalid': hasError,
          'aria-describedby': [
            error && 'error-message',
            helpText && 'help-text',
            success && 'success-message',
            warning && 'warning-message',
            info && 'info-message'
          ].filter(Boolean).join(' ') || undefined
        })}

        {showValidationIcon && (hasError || hasSuccess || hasWarning || hasInfo) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {hasError && (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {hasSuccess && (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {hasWarning && (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {hasInfo && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>

      {helpText && (
        <p id="help-text" className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      <ValidationMessage
        error={error}
        success={success}
        warning={warning}
        info={info}
        size="sm"
      />
    </div>
  )
})

FormField.displayName = 'FormField'

export default FormField

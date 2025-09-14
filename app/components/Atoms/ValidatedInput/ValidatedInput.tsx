/**
 * Validated input component with comprehensive validation support
 * Integrates with the validation system and provides real-time feedback
 */

import React, { forwardRef, useCallback, useEffect, useState } from 'react'
import FormField from '../FormField/FormField'
import { useFieldValidation } from '~/hooks/useValidation'
import { z } from 'zod'

export interface ValidatedInputProps {
  name: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  validationSchema?: z.ZodSchema
  validateOnChange?: boolean
  validateOnBlur?: boolean
  debounceMs?: number
  required?: boolean
  disabled?: boolean
  className?: string
  labelClassName?: string
  fieldClassName?: string
  helpText?: string
  showValidationIcon?: boolean
  autoComplete?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  step?: number
  min?: number
  max?: number
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      name,
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      onBlur,
      validationSchema,
      validateOnChange = true,
      validateOnBlur = true,
      debounceMs = 300,
      required = false,
      disabled = false,
      className = '',
      labelClassName = '',
      fieldClassName = '',
      helpText,
      showValidationIcon = true,
      autoComplete,
      maxLength,
      minLength,
      pattern,
      step,
      min,
      max,
      ...props
    },
    ref
  ) => {
    const [touched, setTouched] = useState(false)

    // Use field validation hook if schema is provided
    const fieldValidation = useFieldValidation(
      validationSchema || z.any(),
      name as any,
      value as any,
      {
        validateOnChange,
        debounceMs
      }
    )

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
      },
      [onChange]
    )

    const handleBlur = useCallback(() => {
      setTouched(true)
      if (onBlur) {
        onBlur()
      }
    }, [onBlur])

    // Determine validation state
    const hasError = touched && fieldValidation.error
    const isValidating = fieldValidation.isValidating

    return (
      <FormField
        label={label}
        error={hasError ? fieldValidation.error : undefined}
        success={touched && !hasError && !isValidating && value ? 'Valid' : undefined}
        required={required}
        disabled={disabled}
        className={className}
        labelClassName={labelClassName}
        fieldClassName={fieldClassName}
        helpText={helpText}
        showValidationIcon={showValidationIcon}
      >
        <input
          ref={ref}
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          step={step}
          min={min}
          max={max}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-1 focus:ring-opacity-50
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${isValidating ? 'animate-pulse' : ''}
          `}
          {...props}
        />
      </FormField>
    )
  }
)

ValidatedInput.displayName = 'ValidatedInput'

export default ValidatedInput

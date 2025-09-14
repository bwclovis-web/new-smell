/**
 * Form types and validation schemas
 * Provides type safety for all form operations
 */

import type { FormEvent } from 'react'

import type { HouseType, PerfumeType, TradePreference, UserRole } from './database'

// Base form types
export interface BaseFormState {
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
  errors: Record<string, string>
  touched: Record<string, boolean>
}

export interface FormFieldProps<T = unknown> {
  name: string
  value: T
  onChange: (_value: T) => void
  onBlur: () => void
  error?: string
  touched?: boolean
  required?: boolean
  disabled?: boolean
}

// Authentication forms
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
  username?: string
  acceptTerms: boolean
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  token: string
  newPassword: string
  confirmPassword: string
}

// User profile forms
export interface UserProfileFormData {
  firstName: string
  lastName: string
  username: string
  email: string
}

export interface UserPreferencesFormData {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    push: boolean
    wishlist: boolean
    comments: boolean
  }
}

// Perfume forms
export interface PerfumeFormData {
  name: string
  description?: string
  image?: string
  perfumeHouseId?: string
  amount: string
  available: string
  price?: string
  placeOfPurchase?: string
  tradePrice?: string
  tradePreference: TradePreference
  tradeOnly: boolean
  type: PerfumeType
  notes?: {
    top: string[]
    heart: string[]
    base: string[]
  }
}

export interface PerfumeSearchFormData {
  query: string
  houseName?: string
  type?: PerfumeType
  priceRange?: {
    min: number
    max: number
  }
  ratingRange?: {
    min: number
    max: number
  }
  notes?: string[]
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface PerfumeFilterFormData {
  houses: string[]
  types: PerfumeType[]
  priceRange: {
    min: number
    max: number
  }
  ratingRange: {
    min: number
    max: number
  }
  notes: string[]
  tradePreference: TradePreference[]
  tradeOnly?: boolean
}

// Rating forms
export interface RatingFormData {
  longevity?: number
  sillage?: number
  gender?: number
  priceValue?: number
  overall?: number
}

export interface RatingFormProps {
  perfumeId: string
  initialRating?: RatingFormData
  onSubmit: (_rating: RatingFormData) => Promise<void>
  onCancel?: () => void
}

// Comment forms
export interface CommentFormData {
  comment: string
  isPublic: boolean
}

export interface CommentFormProps {
  perfumeId: string
  userPerfumeId: string
  initialComment?: CommentFormData
  onSubmit: (_comment: CommentFormData) => Promise<void>
  onCancel?: () => void
}

// Review forms
export interface ReviewFormData {
  review: string
  rating: number
}

export interface ReviewFormProps {
  perfumeId: string
  initialReview?: ReviewFormData
  onSubmit: (_review: ReviewFormData) => Promise<void>
  onCancel?: () => void
}

// Wishlist forms
export interface WishlistFormData {
  notes?: string
  priority: 'low' | 'medium' | 'high'
  notifyOnPriceDrop?: boolean
  notifyOnAvailability?: boolean
}

// Admin forms
export interface AdminUserFormData {
  email: string
  firstName?: string
  lastName?: string
  username?: string
  role: UserRole
  isActive: boolean
}

export interface AdminPerfumeHouseFormData {
  name: string
  description?: string
  image?: string
  website?: string
  country?: string
  founded?: string
  email?: string
  phone?: string
  address?: string
  type: HouseType
}

export interface AdminDataQualityFormData {
  timeframe: '7d' | '30d' | '90d' | '1y' | 'all'
  includeHistory: boolean
  exportFormat: 'csv' | 'json' | 'xlsx'
}

// Form validation types
export interface ValidationRule<T = unknown> {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (_value: T) => string | undefined
  message?: string
}

export type ValidationSchema<T = Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// Form field types
export interface TextFieldProps extends FormFieldProps<string> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url'
  placeholder?: string
  maxLength?: number
  minLength?: number
  pattern?: string
}

export interface NumberFieldProps extends FormFieldProps<number> {
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

export interface SelectFieldProps<T = string> extends FormFieldProps<T> {
  options: Array<{
    value: T
    label: string
    disabled?: boolean
  }>
  placeholder?: string
  multiple?: boolean
}

export interface CheckboxFieldProps extends FormFieldProps<boolean> {
  label?: string
  indeterminate?: boolean
}

export interface RadioFieldProps<T = string> extends FormFieldProps<T> {
  options: Array<{
    value: T
    label: string
    disabled?: boolean
  }>
  orientation?: 'horizontal' | 'vertical'
}

export interface TextAreaFieldProps extends FormFieldProps<string> {
  rows?: number
  cols?: number
  placeholder?: string
  maxLength?: number
  minLength?: number
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
}

export interface FileFieldProps extends FormFieldProps<FileList | null> {
  accept?: string
  multiple?: boolean
  maxSize?: number
  minSize?: number
}

export interface DateFieldProps extends FormFieldProps<string> {
  min?: string
  max?: string
  placeholder?: string
}

export interface RangeFieldProps extends FormFieldProps<number> {
  min: number
  max: number
  step?: number
  showLabels?: boolean
  showValue?: boolean
}

// Form submission types
export interface FormSubmissionState {
  isSubmitting: boolean
  isSuccess: boolean
  isError: boolean
  error?: string
  successMessage?: string
}

export interface FormSubmissionHandler<T = Record<string, unknown>> {
  onSubmit: (_data: T) => Promise<void>
  onSuccess?: (_data: T) => void
  onError?: (_error: Error) => void
  onReset?: () => void
}

// Form hook types
export interface UseFormOptions<T = Record<string, unknown>> {
  initialValues: T
  validationSchema?: ValidationSchema<T>
  onSubmit: (_data: T) => Promise<void>
  onReset?: () => void
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
}

export interface UseFormReturn<T = Record<string, unknown>> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
  setValue: <K extends keyof T>(_field: K, _value: T[K]) => void
  setError: (_field: keyof T, _error: string) => void
  clearError: (_field: keyof T) => void
  setTouched: (_field: keyof T, _touched: boolean) => void
  handleChange: <K extends keyof T>(_field: K) => (_value: T[K]) => void
  handleBlur: (_field: keyof T) => () => void
  handleSubmit: (_e?: FormEvent<HTMLFormElement>) => Promise<void>
  handleReset: () => void
  validate: () => ValidationResult
  reset: () => void
}

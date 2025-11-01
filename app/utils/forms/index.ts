/**
 * Common form utilities
 *
 * Centralized form handling logic to reduce duplication across the application.
 *
 * @example Form submission hook
 * ```typescript
 * import { useFormSubmit, commonValidators } from '~/utils/forms'
 *
 * const { handleSubmit, isSubmitting, errors } = useFormSubmit<LoginData>({
 *   validate: createValidator({
 *     email: commonValidators.email,
 *     password: commonValidators.required('Password')
 *   })
 * })
 * ```
 *
 * @example Remix action wrapper
 * ```typescript
 * import { createFormAction } from '~/utils/forms'
 *
 * export const action = createFormAction(
 *   async (data: FormData) => {
 *     await saveData(data)
 *     return redirect('/success')
 *   },
 *   {
 *     validate: (data) => !data.email ? { error: 'Email required' } : null
 *   }
 * )
 * ```
 */

// Form submission utilities
export {
  useFormSubmit,
  extractFormData,
  formDataToObject,
  createFormAction,
  type UseFormSubmitOptions,
  type UseFormSubmitReturn,
} from "./formSubmit"

// Form validation utilities
export {
  validateEmail,
  validatePassword,
  validateMatch,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  combineValidationErrors,
  validateWithZod,
  createValidator,
  commonValidators,
  sanitizeFormInput,
  sanitizeFormData,
  VALIDATION_MESSAGES,
  type ValidationResult,
} from "./formValidation"

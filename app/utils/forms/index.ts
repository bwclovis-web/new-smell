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
  createFormAction,
  extractFormData,
  formDataToObject,
  useFormSubmit,
  type UseFormSubmitOptions,
  type UseFormSubmitReturn,
} from "./formSubmit"

// Form validation utilities
export {
  combineValidationErrors,
  commonValidators,
  createValidator,
  sanitizeFormData,
  sanitizeFormInput,
  validateEmail,
  validateMatch,
  validateMaxLength,
  validateMinLength,
  validatePassword,
  validateRequired,
  validateWithZod,
  VALIDATION_MESSAGES,
  type ValidationResult,
} from "./formValidation"

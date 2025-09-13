import { useCSRF } from '~/hooks/useCSRF'

/**
 * CSRF Token component for forms
 * Automatically includes CSRF token in form submissions
 */
export function CSRFToken() {
  const { csrfToken, isLoading } = useCSRF()

  if (isLoading || !csrfToken) {
    return null
  }

  return (
    <input
      type="hidden"
      name="_csrf"
      value={csrfToken}
    />
  )
}

/**
 * CSRF Token component with custom name
 */
interface CSRFTokenProps {
  name?: string
}

export function CSRFTokenInput({ name = '_csrf' }: CSRFTokenProps) {
  const { csrfToken, isLoading } = useCSRF()

  if (isLoading || !csrfToken) {
    return null
  }

  return (
    <input
      type="hidden"
      name={name}
      value={csrfToken}
    />
  )
}

import { type FormHTMLAttributes, forwardRef } from 'react'
import { CSRFToken } from './CSRFToken'

interface CSRFProtectedFormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
  csrfName?: string
}

export const CSRFProtectedForm = forwardRef<HTMLFormElement, CSRFProtectedFormProps>(
  ({ children, csrfName = '_csrf', ...props }, ref) => {
    return (
      <form ref={ref} {...props}>
        <CSRFToken name={csrfName} />
        {children}
      </form>
    )
  }
)

CSRFProtectedForm.displayName = 'CSRFProtectedForm'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ValidationMessage from './ValidationMessage'

describe('ValidationMessage', () => {
  describe('Rendering', () => {
    it('should render error message', () => {
      render(<ValidationMessage error="This is an error" />)

      expect(screen.getByText('This is an error')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })

    it('should render success message', () => {
      render(<ValidationMessage success="This is a success" />)

      expect(screen.getByText('This is a success')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    it('should render warning message', () => {
      render(<ValidationMessage warning="This is a warning" />)

      expect(screen.getByText('This is a warning')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })

    it('should render info message', () => {
      render(<ValidationMessage info="This is info" />)

      expect(screen.getByText('This is info')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('ℹ️')).toBeInTheDocument()
    })

    it('should not render when no message provided', () => {
      const { container } = render(<ValidationMessage />)

      expect(container.firstChild).toBeNull()
    })

    it('should prioritize error over other message types', () => {
      render(<ValidationMessage
          error="Error message"
          success="Success message"
          warning="Warning message"
          info="Info message"
        />)

      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument()
      expect(screen.queryByText('Info message')).not.toBeInTheDocument()
    })

    it('should prioritize success over warning and info', () => {
      render(<ValidationMessage
          success="Success message"
          warning="Warning message"
          info="Info message"
        />)

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument()
      expect(screen.queryByText('Info message')).not.toBeInTheDocument()
    })

    it('should prioritize warning over info', () => {
      render(<ValidationMessage
          warning="Warning message"
          info="Info message"
        />)

      expect(screen.getByText('Warning message')).toBeInTheDocument()
      expect(screen.queryByText('Info message')).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply error styling', () => {
      render(<ValidationMessage error="Error message" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800')
    })

    it('should apply success styling', () => {
      render(<ValidationMessage success="Success message" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800')
    })

    it('should apply warning styling', () => {
      render(<ValidationMessage warning="Warning message" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800')
    })

    it('should apply info styling', () => {
      render(<ValidationMessage info="Info message" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800')
    })

    it('should apply custom className', () => {
      render(<ValidationMessage error="Error message" className="custom-class" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('custom-class')
    })
  })

  describe('Size variants', () => {
    it('should apply small size styling', () => {
      render(<ValidationMessage error="Error message" size="sm" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('text-xs', 'px-2', 'py-1')
    })

    it('should apply medium size styling (default)', () => {
      render(<ValidationMessage error="Error message" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('text-sm', 'px-3', 'py-2')
    })

    it('should apply large size styling', () => {
      render(<ValidationMessage error="Error message" size="lg" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('text-base', 'px-4', 'py-3')
    })
  })

  describe('Icon display', () => {
    it('should show icon by default', () => {
      render(<ValidationMessage error="Error message" />)

      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toHaveAttribute('aria-hidden', 'true')
    })

    it('should hide icon when showIcon is false', () => {
      render(<ValidationMessage error="Error message" showIcon={false} />)

      expect(screen.queryByText('⚠️')).not.toBeInTheDocument()
    })

    it('should apply correct icon color classes', () => {
      render(<ValidationMessage error="Error message" />)

      const icon = screen.getByText('⚠️')
      expect(icon).toHaveClass('text-red-500')
    })

    it('should show correct icons for each type', () => {
      const { rerender } = render(<ValidationMessage error="Error" />)
      expect(screen.getByText('⚠️')).toBeInTheDocument()

      rerender(<ValidationMessage success="Success" />)
      expect(screen.getByText('✓')).toBeInTheDocument()

      rerender(<ValidationMessage warning="Warning" />)
      expect(screen.getByText('⚠️')).toBeInTheDocument()

      rerender(<ValidationMessage info="Info" />)
      expect(screen.getByText('ℹ️')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ValidationMessage error="Error message" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })

    it('should have proper icon accessibility', () => {
      render(<ValidationMessage error="Error message" />)

      const icon = screen.getByText('⚠️')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string messages', () => {
      const { container } = render(<ValidationMessage error="" />)

      expect(container.firstChild).toBeNull()
    })

    it('should handle null messages', () => {
      const { container } = render(<ValidationMessage error={null as any} />)

      expect(container.firstChild).toBeNull()
    })

    it('should handle undefined messages', () => {
      const { container } = render(<ValidationMessage error={undefined} />)

      expect(container.firstChild).toBeNull()
    })
  })
})

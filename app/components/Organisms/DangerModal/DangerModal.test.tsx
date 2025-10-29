import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import DangerModal from './DangerModal'

describe('DangerModal', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Rendering', () => {
    it('renders the danger modal', () => {
      render(<DangerModal />)
      expect(screen.getByText('Are you sure you want to Remove?')).toBeInTheDocument()
    })

    it('renders the warning message', () => {
      render(<DangerModal />)
      expect(screen.getByText(/Once Removed you will lose all history/)).toBeInTheDocument()
    })

    it('renders complete warning text', () => {
      render(<DangerModal />)
      const warningText = screen.getByText(/Once Removed you will lose all history, notes and entries in the exchange/)
      expect(warningText).toBeInTheDocument()
    })
  })

  describe('Children', () => {
    it('renders children when provided', () => {
      render(<DangerModal>
          <button>Cancel</button>
          <button>Confirm</button>
        </DangerModal>)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Confirm')).toBeInTheDocument()
    })

    it('renders without children', () => {
      expect(() => render(<DangerModal />)).not.toThrow()
    })

    it('renders complex children', () => {
      render(<DangerModal>
          <div className="flex gap-2">
            <button className="btn-primary">Confirm Delete</button>
            <button className="btn-secondary">Cancel</button>
          </div>
        </DangerModal>)

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('renders text children', () => {
      render(<DangerModal>
          Additional warning text
        </DangerModal>)

      expect(screen.getByText('Additional warning text')).toBeInTheDocument()
    })

    it('renders null children without error', () => {
      expect(() => render(<DangerModal>{null}</DangerModal>)).not.toThrow()
    })
  })

  describe('Styling', () => {
    it('applies centered text class', () => {
      const { container } = render(<DangerModal />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('text-center')
    })

    it('applies auto margin class', () => {
      const { container } = render(<DangerModal />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('mx-auto')
    })

    it('has h2 element for title', () => {
      render(<DangerModal />)
      const title = screen.getByRole('heading', { level: 2 })
      expect(title).toHaveTextContent('Are you sure you want to Remove?')
    })

    it('applies noir color classes to warning text', () => {
      const { container } = render(<DangerModal />)
      const warningP = container.querySelector('.text-noir-gold-100')
      expect(warningP).toBeInTheDocument()
    })

    it('applies text-xl to warning text', () => {
      const { container } = render(<DangerModal />)
      const warningP = container.querySelector('.text-xl')
      expect(warningP).toBeInTheDocument()
    })

    it('applies mt-4 to children container', () => {
      const { container } = render(<DangerModal>
          <button>Test</button>
        </DangerModal>)

      const childrenContainer = container.querySelector('.mt-4')
      expect(childrenContainer).toBeInTheDocument()
    })
  })

  describe('Structure', () => {
    it('has correct HTML structure', () => {
      const { container } = render(<DangerModal />)

      const wrapper = container.firstChild
      expect(wrapper).toBeInstanceOf(HTMLDivElement)

      const h2 = container.querySelector('h2')
      expect(h2).toBeInTheDocument()

      const p = container.querySelector('p')
      expect(p).toBeInTheDocument()
    })

    it('wraps children in a div with mt-4', () => {
      const { container } = render(<DangerModal>
          <button>Test Button</button>
        </DangerModal>)

      const button = screen.getByText('Test Button')
      const parent = button.parentElement
      expect(parent).toHaveClass('mt-4')
    })

    it('maintains proper order: title, warning, children', () => {
      const { container } = render(<DangerModal>
          <button>Action</button>
        </DangerModal>)

      const elements = container.querySelectorAll('h2, p, .mt-4')
      expect(elements.length).toBe(3)

      // Verify order
      expect(elements[0].tagName).toBe('H2')
      expect(elements[1].tagName).toBe('P')
      expect(elements[2]).toHaveClass('mt-4')
    })
  })

  describe('Text Content', () => {
    it('displays correct title text', () => {
      render(<DangerModal />)
      expect(screen.getByText('Are you sure you want to Remove?')).toBeInTheDocument()
    })

    it('uses proper capitalization in title', () => {
      render(<DangerModal />)
      const title = screen.getByRole('heading')
      expect(title).toHaveTextContent(/Remove/)
    })

    it('displays complete warning about data loss', () => {
      render(<DangerModal />)
      const warning = screen.getByText(/lose all history/)
      expect(warning).toHaveTextContent('history')
      expect(warning).toHaveTextContent('notes')
      expect(warning).toHaveTextContent('entries')
      expect(warning).toHaveTextContent('exchange')
    })
  })

  describe('Accessibility', () => {
    it('has semantic heading for title', () => {
      render(<DangerModal />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
    })

    it('provides clear warning message', () => {
      render(<DangerModal />)
      const warning = screen.getByText(/Once Removed/)
      expect(warning).toBeInTheDocument()
      expect(warning.tagName).toBe('P')
    })

    it('uses semantic HTML elements', () => {
      const { container } = render(<DangerModal />)

      expect(container.querySelector('h2')).toBeInTheDocument()
      expect(container.querySelector('p')).toBeInTheDocument()
      expect(container.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders with undefined children', () => {
      expect(() => render(<DangerModal>{undefined}</DangerModal>)).not.toThrow()
    })

    it('renders with empty string children', () => {
      render(<DangerModal>{''}</DangerModal>)
      expect(screen.getByText('Are you sure you want to Remove?')).toBeInTheDocument()
    })

    it('renders with array of children', () => {
      render(<DangerModal>
          {[
            <button key="1">Button 1</button>,
            <button key="2">Button 2</button>
          ]}
        </DangerModal>)

      expect(screen.getByText('Button 1')).toBeInTheDocument()
      expect(screen.getByText('Button 2')).toBeInTheDocument()
    })

    it('renders with fragment children', () => {
      render(<DangerModal>
          <>
            <span>First</span>
            <span>Second</span>
          </>
        </DangerModal>)

      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })

    it('handles nested components as children', () => {
      const NestedComponent = () => (
        <div>
          <p>Nested content</p>
          <button>Nested button</button>
        </div>
      )

      render(<DangerModal>
          <NestedComponent />
        </DangerModal>)

      expect(screen.getByText('Nested content')).toBeInTheDocument()
      expect(screen.getByText('Nested button')).toBeInTheDocument()
    })
  })

  describe('Use Cases', () => {
    it('renders with action buttons', () => {
      render(<DangerModal>
          <div className="flex gap-2">
            <button className="bg-red-600 text-white px-4 py-2">Delete</button>
            <button className="bg-gray-600 text-white px-4 py-2">Cancel</button>
          </div>
        </DangerModal>)

      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('renders with form elements', () => {
      render(<DangerModal>
          <form>
            <input type="checkbox" id="confirm" />
            <label htmlFor="confirm">I understand</label>
            <button type="submit">Proceed</button>
          </form>
        </DangerModal>)

      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      expect(screen.getByText('I understand')).toBeInTheDocument()
      expect(screen.getByText('Proceed')).toBeInTheDocument()
    })

    it('renders with additional warning text', () => {
      render(<DangerModal>
          <p className="text-red-500 font-bold">
            This action cannot be undone!
          </p>
          <button>I Understand</button>
        </DangerModal>)

      expect(screen.getByText('This action cannot be undone!')).toBeInTheDocument()
      expect(screen.getByText('I Understand')).toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('centers content horizontally and vertically', () => {
      const { container } = render(<DangerModal />)
      const wrapper = container.firstChild

      expect(wrapper).toHaveClass('text-center')
      expect(wrapper).toHaveClass('mx-auto')
    })

    it('maintains consistent spacing between elements', () => {
      const { container } = render(<DangerModal>
          <button>Test</button>
        </DangerModal>)

      const childrenContainer = container.querySelector('.mt-4')
      expect(childrenContainer).toBeInTheDocument()
    })
  })

  describe('Visual Hierarchy', () => {
    it('title is more prominent than warning text', () => {
      const { container } = render(<DangerModal />)

      const title = container.querySelector('h2')
      const warning = container.querySelector('p')

      expect(title?.tagName).toBe('H2')
      expect(warning?.tagName).toBe('P')
    })

    it('applies appropriate text sizing', () => {
      const { container } = render(<DangerModal />)

      const warning = container.querySelector('.text-xl')
      expect(warning).toBeInTheDocument()
    })

    it('uses color to indicate warning severity', () => {
      const { container } = render(<DangerModal />)

      const warning = container.querySelector('.text-noir-gold-100')
      expect(warning).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('works as part of a modal system', () => {
      render(<div className="modal">
          <DangerModal>
            <button>Confirm</button>
            <button>Cancel</button>
          </DangerModal>
        </div>)

      expect(screen.getByText('Are you sure you want to Remove?')).toBeInTheDocument()
      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('integrates with button components', () => {
      render(<DangerModal>
          <button data-testid="confirm-btn">Confirm</button>
          <button data-testid="cancel-btn">Cancel</button>
        </DangerModal>)

      expect(screen.getByTestId('confirm-btn')).toBeInTheDocument()
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument()
    })
  })
})


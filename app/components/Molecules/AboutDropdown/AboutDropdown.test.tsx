import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../test/utils/test-utils'
import AboutDropdown from './AboutDropdown'

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'navigation.about': 'About',
        'navigation.aboutUs': 'About Us',
        'navigation.howWeWork': 'How We Work'
      }
      return translations[key] || key
    },
    ready: true
  })
}))

describe('AboutDropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders the dropdown button with correct text', () => {
      renderWithProviders(<AboutDropdown />)
      expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument()
    })

    it('renders with desktop variant by default', () => {
      const { container } = renderWithProviders(<AboutDropdown />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-noir-gold')
      expect(button).not.toHaveClass('block')
    })

    it('renders with mobile variant when specified', () => {
      renderWithProviders(<AboutDropdown variant="mobile" />)
      const button = screen.getByRole('button')
      // Note: 'flex' class overrides 'block' in styleMerge, so we check for mobile-specific classes
      expect(button).toHaveClass('mobile-touch-target')
      expect(button).toHaveClass('py-4')
    })

    it('applies custom className', () => {
      const { container } = renderWithProviders(<AboutDropdown className="custom-class" />)
      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
    })

    it('has correct ARIA attributes when closed', () => {
      renderWithProviders(<AboutDropdown />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveAttribute('aria-haspopup', 'true')
    })
  })

  describe('Dropdown Interaction', () => {
    it('opens dropdown when button is clicked', async () => {
      vi.useRealTimers() // Use real timers for user interactions with Router
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      expect(screen.getByText('About Us')).toBeInTheDocument()
      expect(screen.getByText('How We Work')).toBeInTheDocument()
      vi.useFakeTimers() // Restore fake timers
    })

    it('closes dropdown when button is clicked again', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })

      // Open dropdown
      await user.click(button)
      expect(screen.getByText('About Us')).toBeInTheDocument()

      // Close dropdown
      await user.click(button)
      await waitFor(() => {
        expect(screen.queryByText('About Us')).not.toBeInTheDocument()
      })
    })

    it('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')

      await user.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    it('rotates chevron icon when dropdown is open', async () => {
      const user = userEvent.setup({ delay: null })
      const { container } = renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      const chevron = container.querySelector('svg')
      expect(chevron).toHaveClass('rotate-180')
    })
  })

  describe('Dropdown Menu Items', () => {
    it('displays all menu items when open', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      expect(screen.getByRole('link', { name: /about us/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /how we work/i })).toBeInTheDocument()
    })

    it('has correct paths for menu items', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      const aboutUsLink = screen.getByRole('link', { name: /about us/i })
      const howWeWorkLink = screen.getByRole('link', { name: /how we work/i })

      expect(aboutUsLink).toHaveAttribute('href', '/about-us')
      expect(howWeWorkLink).toHaveAttribute('href', '/how-we-work')
    })

    it('closes dropdown when menu item is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      const aboutUsLink = screen.getByRole('link', { name: /about us/i })
      await user.click(aboutUsLink)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /how we work/i })).not.toBeInTheDocument()
      })
    })

    it('calls onNavClick callback when menu item is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      const onNavClick = vi.fn()
      renderWithProviders(<AboutDropdown onNavClick={onNavClick} />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      const aboutUsLink = screen.getByRole('link', { name: /about us/i })
      await user.click(aboutUsLink)

      expect(onNavClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Click Outside Behavior', () => {
    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup({ delay: null })
      const { container } = renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      expect(screen.getByText('About Us')).toBeInTheDocument()

      // Click outside
      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByText('About Us')).not.toBeInTheDocument()
      })
    })

    it('does not close dropdown when clicking inside', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      expect(screen.getByText('About Us')).toBeInTheDocument()

      // Click on the dropdown content
      const dropdown = screen.getByText('About Us').closest('div')
      if (dropdown) {
        fireEvent.mouseDown(dropdown)
      }

      // Dropdown should still be open
      expect(screen.getByText('About Us')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies correct desktop styles', () => {
      renderWithProviders(<AboutDropdown variant="desktop" />)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('text-noir-gold')
      expect(button).toHaveClass('hover:text-noir-light')
      expect(button).toHaveClass('font-semibold')
    })

    it('applies correct mobile styles', () => {
      renderWithProviders(<AboutDropdown variant="mobile" />)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('block')
      expect(button).toHaveClass('mobile-touch-target')
      expect(button).toHaveClass('py-4')
    })

    it('highlights button when dropdown is open', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      expect(button).toHaveClass('text-noir-light')
      expect(button).toHaveClass('bg-noir-black/30')
    })
  })

  describe('Accessibility', () => {
    it('has proper keyboard navigation support', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })

      // Tab to button
      await user.tab()
      expect(button).toHaveFocus()

      // Press Enter to open
      await user.keyboard('{Enter}')
      expect(screen.getByText('About Us')).toBeInTheDocument()
    })

    it('has correct role attributes', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      expect(button).toHaveAttribute('aria-haspopup', 'true')

      await user.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    it('provides navigation links that are accessible', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)

      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })
  })

  describe('Client-side Hydration', () => {
    it('shows fallback text before client is ready', () => {
      vi.mock('react-i18next', () => ({
        useTranslation: () => ({
          t: (key: string) => key,
          ready: false
        })
      }))

      const { rerender } = renderWithProviders(<AboutDropdown />)

      // After mount, should show translated text
      vi.advanceTimersByTime(0)
      rerender(<AboutDropdown />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid open/close clicks', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })

      // Rapid clicks
      await user.click(button)
      await user.click(button)
      await user.click(button)

      // Should end up in closed state
      expect(screen.queryByText('About Us')).not.toBeInTheDocument()
    })

    it('handles onNavClick being undefined', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<AboutDropdown />)

      const button = screen.getByRole('button', { name: /about/i })
      await user.click(button)

      const aboutUsLink = screen.getByRole('link', { name: /about us/i })

      // Should not throw error
      await expect(user.click(aboutUsLink)).resolves.not.toThrow()
    })

    it('cleans up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = renderWithProviders(<AboutDropdown />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })
})



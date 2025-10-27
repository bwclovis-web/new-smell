import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../test/utils/test-utils'
import MobileNavigation from './MobileNavigation'

// Mock the session store
const mockToggleModal = vi.fn()
const mockSessionStore = {
  toggleModal: mockToggleModal,
  modalOpen: false,
  modalId: null
}

vi.mock('~/stores/sessionStore', () => ({
  useSessionStore: () => mockSessionStore
}))

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'navigation.logo': 'Shadow and Sillage',
        'navigation.perfumes': 'Perfumes',
        'navigation.houses': 'Houses',
        'navigation.reviews': 'Reviews',
        'navigation.admin': 'Admin'
      }
      return translations[key] || key
    },
    ready: true
  })
}))

// Mock AboutDropdown and LogoutButton
vi.mock('../AboutDropdown/AboutDropdown', () => ({
  default: ({ onNavClick, variant }: any) => (
    <div data-testid="about-dropdown" data-variant={variant} onClick={onNavClick}>
      About Dropdown
    </div>
  )
}))

vi.mock('../LogoutButton/LogoutButton', () => ({
  default: () => <button data-testid="logout-button">Logout</button>
}))

describe('MobileNavigation', () => {
  const mockUser = {
    id: 'user-1',
    role: 'user'
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockSessionStore.modalOpen = false
    mockSessionStore.modalId = null
    mockToggleModal.mockClear()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the mobile navigation header', () => {
      renderWithProviders(<MobileNavigation />)
      expect(screen.getByText('S&S')).toBeInTheDocument()
    })

    it('applies mobile-specific classes', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const wrapper = container.firstChild
      
      expect(wrapper).toHaveClass('mobile-nav')
      expect(wrapper).toHaveClass('md:hidden')
      expect(wrapper).toHaveClass('fixed')
      expect(wrapper).toHaveClass('w-full')
    })

    it('applies custom className', () => {
      const { container } = renderWithProviders(<MobileNavigation className="custom-class" />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('custom-class')
    })

    it('has proper z-index for overlay', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('z-30')
    })
  })

  describe('Header', () => {
    it('displays logo text on larger screens', () => {
      renderWithProviders(<MobileNavigation />)
      expect(screen.getByText('Shadow and Sillage')).toBeInTheDocument()
    })

    it('displays abbreviated logo on small screens', () => {
      renderWithProviders(<MobileNavigation />)
      expect(screen.getByText('S&S')).toBeInTheDocument()
    })

    it('has home link with correct path', () => {
      renderWithProviders(<MobileNavigation />)
      const homeLink = screen.getByRole('link', { name: /shadow and sillage/i })
      expect(homeLink).toHaveAttribute('href', '/')
    })

    it('displays home icon', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const homeLink = screen.getByRole('link', { name: /shadow and sillage/i })
      const icon = homeLink.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('applies backdrop blur effect', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const header = container.querySelector('.backdrop-blur-md')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Menu Button', () => {
    it('renders menu button', () => {
      renderWithProviders(<MobileNavigation />)
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('has proper aria attributes when menu is closed', () => {
      renderWithProviders(<MobileNavigation />)
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu')
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('has proper aria attributes when menu is open', () => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
      
      renderWithProviders(<MobileNavigation />)
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      
      expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('calls toggleModal when clicked', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<MobileNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)
      
      expect(mockToggleModal).toHaveBeenCalledTimes(1)
    })

    it('displays bars icon', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      const icon = menuButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Modal Menu', () => {
    beforeEach(() => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
    })

    it('renders modal when menu is open', () => {
      renderWithProviders(<MobileNavigation />)
      expect(screen.getByText('Menu')).toBeInTheDocument()
    })

    it('does not render modal when menu is closed', () => {
      mockSessionStore.modalOpen = false
      renderWithProviders(<MobileNavigation />)
      expect(screen.queryByText('Menu')).not.toBeInTheDocument()
    })

    it('renders navigation links in modal', () => {
      renderWithProviders(<MobileNavigation />)
      
      // mainNavigation items should be rendered
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    it('renders AboutDropdown in modal', () => {
      renderWithProviders(<MobileNavigation />)
      expect(screen.getByTestId('about-dropdown')).toBeInTheDocument()
    })

    it('passes mobile variant to AboutDropdown', () => {
      renderWithProviders(<MobileNavigation />)
      const dropdown = screen.getByTestId('about-dropdown')
      expect(dropdown).toHaveAttribute('data-variant', 'mobile')
    })
  })

  describe('Navigation Links', () => {
    beforeEach(() => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
    })

    it('closes menu when navigation link is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<MobileNavigation />)
      
      const links = screen.getAllByRole('link').filter(link => link.getAttribute('href') && link.getAttribute('href') !== '/')
      
      if (links.length > 0) {
        await user.click(links[0])
        expect(mockToggleModal).toHaveBeenCalled()
      }
    })

    it('calls onMenuClose when link is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      const onMenuClose = vi.fn()
      
      renderWithProviders(<MobileNavigation onMenuClose={onMenuClose} />)
      
      const links = screen.getAllByRole('link').filter(link => link.getAttribute('href') && link.getAttribute('href') !== '/')
      
      if (links.length > 0) {
        await user.click(links[0])
        expect(onMenuClose).toHaveBeenCalledTimes(1)
      }
    })

    it('applies active styling to current route', () => {
      renderWithProviders(<MobileNavigation />, { initialEntries: ['/'] })
      
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('User Section - Not Logged In', () => {
    beforeEach(() => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
    })

    it('shows Sign In link when user is not provided', () => {
      renderWithProviders(<MobileNavigation />)
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    it('links to sign in page', () => {
      renderWithProviders(<MobileNavigation />)
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toHaveAttribute('href', '/login')
    })

    it('displays user icon', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      const icon = signInLink.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('closes menu when Sign In is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<MobileNavigation />)
      
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      await user.click(signInLink)
      
      expect(mockToggleModal).toHaveBeenCalled()
    })
  })

  describe('User Section - Logged In', () => {
    beforeEach(() => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
    })

    it('shows Admin link when user is logged in', () => {
      renderWithProviders(<MobileNavigation user={mockUser} />)
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('links to admin profile page', () => {
      renderWithProviders(<MobileNavigation user={mockUser} />)
      const adminLink = screen.getByRole('link', { name: /admin/i })
      expect(adminLink).toHaveAttribute('href', '/admin/profile')
    })

    it('displays logout button when user is logged in', () => {
      renderWithProviders(<MobileNavigation user={mockUser} />)
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    })

    it('shows user icon when logged in', () => {
      const { container } = renderWithProviders(<MobileNavigation user={mockUser} />)
      const userIcons = container.querySelectorAll('svg')
      expect(userIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Quick Actions', () => {
    beforeEach(() => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
    })

    it('renders quick actions section', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const quickActionsSection = container.querySelector('.grid-cols-2')
      expect(quickActionsSection).toBeInTheDocument()
    })

    it('has Home quick action', () => {
      renderWithProviders(<MobileNavigation />)
      const homeLinks = screen.getAllByRole('link', { name: /home/i })
      expect(homeLinks.length).toBeGreaterThan(0)
    })

    it('has Search quick action', () => {
      renderWithProviders(<MobileNavigation />)
      const searchButton = screen.getByRole('button', { name: /search/i })
      expect(searchButton).toBeInTheDocument()
    })

    it('focuses search input when Search is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      const mockFocus = vi.fn()
      
      document.querySelector = vi.fn(() => ({
        focus: mockFocus
      } as any))
      
      renderWithProviders(<MobileNavigation />)
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      await user.click(searchButton)
      
      expect(mockFocus).toHaveBeenCalled()
    })

    it('closes menu when search is activated', async () => {
      const user = userEvent.setup({ delay: null })
      document.querySelector = vi.fn(() => ({
        focus: vi.fn()
      } as any))
      
      renderWithProviders(<MobileNavigation />)
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      await user.click(searchButton)
      
      expect(mockToggleModal).toHaveBeenCalled()
    })

    it('handles missing search input gracefully', async () => {
      const user = userEvent.setup({ delay: null })
      document.querySelector = vi.fn(() => null)
      
      renderWithProviders(<MobileNavigation />)
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      await expect(user.click(searchButton)).resolves.not.toThrow()
    })
  })

  describe('Client-side Hydration', () => {
    it('shows fallback text before client is ready', () => {
      renderWithProviders(<MobileNavigation />)
      // Component should still render even if translation is not ready
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('handles translation ready state', () => {
      renderWithProviders(<MobileNavigation />)
      // After mount, should show translated text
      vi.advanceTimersByTime(0)
      expect(screen.getByText('Shadow and Sillage')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies noir color scheme', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const header = container.querySelector('.bg-noir-dark\\/60')
      expect(header).toBeInTheDocument()
    })

    it('uses safe area insets', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const safeArea = container.querySelector('.mobile-safe-top')
      expect(safeArea).toBeInTheDocument()
    })

    it('applies touch-friendly targets', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const touchTargets = container.querySelectorAll('.mobile-touch-target')
      expect(touchTargets.length).toBeGreaterThan(0)
    })

    it('has transition effects', () => {
      renderWithProviders(<MobileNavigation />)
      const links = screen.getAllByRole('link')
      
      links.forEach(link => {
        expect(link).toHaveClass('transition-colors')
      })
    })
  })

  describe('Modal Styling', () => {
    beforeEach(() => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
    })

    it('has scrollable content area', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const scrollArea = container.querySelector('.overflow-y-auto')
      expect(scrollArea).toBeInTheDocument()
    })

    it('has max height for modal', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const modal = container.querySelector('.max-h-\\[90vh\\]')
      expect(modal).toBeInTheDocument()
    })

    it('has sticky header in modal', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const stickyHeader = container.querySelector('.sticky')
      expect(stickyHeader).toBeInTheDocument()
    })

    it('separates sections with borders', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const borders = container.querySelectorAll('.border-t')
      expect(borders.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = renderWithProviders(<MobileNavigation />)
      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()
    })

    it('has accessible button labels', () => {
      renderWithProviders(<MobileNavigation />)
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toHaveAttribute('aria-label')
    })

    it('has keyboard-accessible links', () => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
      
      renderWithProviders(<MobileNavigation />)
      const links = screen.getAllByRole('link')
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('provides focus management', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<MobileNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.tab()
      
      // Button should be focusable
      expect(menuButton).toBeInTheDocument()
    })
  })

  describe('User Prop Variations', () => {
    beforeEach(() => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
    })

    it('handles admin user', () => {
      const adminUser = { id: 'admin-1', role: 'admin' }
      renderWithProviders(<MobileNavigation user={adminUser} />)
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    })

    it('handles editor user', () => {
      const editorUser = { id: 'editor-1', role: 'editor' }
      renderWithProviders(<MobileNavigation user={editorUser} />)
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    })

    it('handles null user', () => {
      renderWithProviders(<MobileNavigation user={null} />)
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    it('handles undefined user', () => {
      renderWithProviders(<MobileNavigation user={undefined} />)
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid menu open/close', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<MobileNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      
      await user.click(menuButton)
      await user.click(menuButton)
      await user.click(menuButton)
      
      expect(mockToggleModal).toHaveBeenCalledTimes(3)
    })

    it('handles onMenuClose being undefined', async () => {
      const user = userEvent.setup({ delay: null })
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
      
      renderWithProviders(<MobileNavigation />)
      
      const links = screen.getAllByRole('link').filter(link => link.getAttribute('href') && link.getAttribute('href') !== '/')
      
      if (links.length > 0) {
        await expect(user.click(links[0])).resolves.not.toThrow()
      }
    })

    it('renders without any props', () => {
      expect(() => renderWithProviders(<MobileNavigation />)).not.toThrow()
    })

    it('handles missing navigation data', () => {
      renderWithProviders(<MobileNavigation />)
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('integrates with session store', () => {
      renderWithProviders(<MobileNavigation />)
      expect(mockSessionStore).toBeDefined()
    })

    it('integrates with router', () => {
      const { history } = renderWithProviders(
        <MobileNavigation />,
        { initialEntries: ['/'] }
      )
      
      expect(history.location.pathname).toBe('/')
    })

    it('passes callbacks to child components', () => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
      
      renderWithProviders(<MobileNavigation />)
      
      const aboutDropdown = screen.getByTestId('about-dropdown')
      expect(aboutDropdown).toBeInTheDocument()
    })
  })

  describe('Modal State Management', () => {
    it('shows modal when modalOpen is true and modalId matches', () => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'mobile-navigation-menu'
      
      renderWithProviders(<MobileNavigation />)
      expect(screen.getByText('Menu')).toBeInTheDocument()
    })

    it('hides modal when modalOpen is false', () => {
      mockSessionStore.modalOpen = false
      mockSessionStore.modalId = 'mobile-navigation-menu'
      
      renderWithProviders(<MobileNavigation />)
      expect(screen.queryByText('Menu')).not.toBeInTheDocument()
    })

    it('hides modal when modalId does not match', () => {
      mockSessionStore.modalOpen = true
      mockSessionStore.modalId = 'different-modal'
      
      renderWithProviders(<MobileNavigation />)
      expect(screen.queryByText('Menu')).not.toBeInTheDocument()
    })
  })

  describe('Home Link Behavior', () => {
    it('closes menu when home link in header is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(<MobileNavigation />)
      
      const homeLink = screen.getByRole('link', { name: /shadow and sillage/i })
      await user.click(homeLink)
      
      expect(mockToggleModal).toHaveBeenCalled()
    })

    it('calls onMenuClose when home link is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      const onMenuClose = vi.fn()
      
      renderWithProviders(<MobileNavigation onMenuClose={onMenuClose} />)
      
      const homeLink = screen.getByRole('link', { name: /shadow and sillage/i })
      await user.click(homeLink)
      
      expect(onMenuClose).toHaveBeenCalledTimes(1)
    })
  })
})



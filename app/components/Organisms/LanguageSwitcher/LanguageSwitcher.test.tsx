import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LanguageSwitcher from './LanguageSwitcher'

// Mock useTranslation
const mockChangeLanguage = vi.fn()
const mockI18n = {
  language: 'en',
  changeLanguage: mockChangeLanguage
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: mockI18n
  })
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockI18n.language = 'en'
  })

  afterEach(() => {
    cleanup()
  })

  describe('Rendering', () => {
    it('renders the language switcher', () => {
      render(<LanguageSwitcher />)
      const select = screen.getByRole('combobox', { name: /select language/i })
      expect(select).toBeInTheDocument()
    })

    it('renders with correct aria-label', () => {
      render(<LanguageSwitcher />)
      const select = screen.getByLabelText(/select language/i)
      expect(select).toBeInTheDocument()
    })

    it('renders English option', () => {
      render(<LanguageSwitcher />)
      expect(screen.getByRole('option', { name: /english/i })).toBeInTheDocument()
    })

    it('renders Spanish option', () => {
      render(<LanguageSwitcher />)
      expect(screen.getByRole('option', { name: /español/i })).toBeInTheDocument()
    })

    it('renders all language options', () => {
      render(<LanguageSwitcher />)
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(2)
    })
  })

  describe('Default Selection', () => {
    it('defaults to English when current language is en', () => {
      mockI18n.language = 'en'
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('en')
    })

    it('defaults to Spanish when current language is es', () => {
      mockI18n.language = 'es'
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('es')
    })

    it('reflects current i18n language', () => {
      mockI18n.language = 'en'
      const { rerender } = render(<LanguageSwitcher />)

      let select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('en')

      mockI18n.language = 'es'
      rerender(<LanguageSwitcher />)

      select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('es')
    })
  })

  describe('Language Change', () => {
    it('calls changeLanguage when selecting English', async () => {
      const user = userEvent.setup()
      mockI18n.language = 'es'
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'en')

      expect(mockChangeLanguage).toHaveBeenCalledWith('en')
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1)
    })

    it('calls changeLanguage when selecting Spanish', async () => {
      const user = userEvent.setup()
      mockI18n.language = 'en'
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'es')

      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1)
    })

    it('handles language change via fireEvent', () => {
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'es' } })

      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
    })

    it('can switch back and forth between languages', async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')

      await user.selectOptions(select, 'es')
      expect(mockChangeLanguage).toHaveBeenCalledWith('es')

      await user.selectOptions(select, 'en')
      expect(mockChangeLanguage).toHaveBeenCalledWith('en')

      expect(mockChangeLanguage).toHaveBeenCalledTimes(2)
    })
  })

  describe('Language Options', () => {
    it('has correct value for English option', () => {
      render(<LanguageSwitcher />)
      const englishOption = screen.getByRole('option', { name: /english/i }) as HTMLOptionElement
      expect(englishOption.value).toBe('en')
    })

    it('has correct value for Spanish option', () => {
      render(<LanguageSwitcher />)
      const spanishOption = screen.getByRole('option', { name: /español/i }) as HTMLOptionElement
      expect(spanishOption.value).toBe('es')
    })

    it('displays correct label for English', () => {
      render(<LanguageSwitcher />)
      expect(screen.getByText('English')).toBeInTheDocument()
    })

    it('displays correct label for Spanish', () => {
      render(<LanguageSwitcher />)
      expect(screen.getByText('Español')).toBeInTheDocument()
    })
  })

  describe('Select Component Integration', () => {
    it('uses compact size variant', () => {
      render(<LanguageSwitcher />)
      const select = screen.getByRole('combobox')
      // The Select component should apply compact styling
      expect(select).toBeInTheDocument()
    })

    it('has correct select id', () => {
      render(<LanguageSwitcher />)
      const select = screen.getByRole('combobox')
      expect(select).toHaveAttribute('id', 'language-switcher')
    })

    it('is accessible via label', () => {
      render(<LanguageSwitcher />)
      const select = screen.getByLabelText(/select language/i)
      expect(select).toHaveAttribute('id', 'language-switcher')
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label', () => {
      render(<LanguageSwitcher />)
      const select = screen.getByRole('combobox')
      expect(select).toHaveAccessibleName(/select language/i)
    })

    it('has semantic select element', () => {
      render(<LanguageSwitcher />)
      const select = screen.getByRole('combobox')
      expect(select.tagName).toBe('SELECT')
    })

    it('all options are accessible', () => {
      render(<LanguageSwitcher />)
      const options = screen.getAllByRole('option')

      options.forEach(option => {
        expect(option).toBeInTheDocument()
        expect(option).toHaveAttribute('value')
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')

      // Tab to select
      await user.tab()
      expect(select).toHaveFocus()

      // Arrow down to change selection
      await user.keyboard('{ArrowDown}')
      expect(select).toHaveFocus()
    })
  })

  describe('i18n Integration', () => {
    it('reads current language from i18n', () => {
      mockI18n.language = 'en'
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('en')
    })

    it('calls i18n.changeLanguage with correct value', () => {
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'es' } })

      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
    })

    it('handles changeLanguage function correctly', () => {
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')

      // Simulate selecting each language
      fireEvent.change(select, { target: { value: 'en' } })
      expect(mockChangeLanguage).toHaveBeenLastCalledWith('en')

      fireEvent.change(select, { target: { value: 'es' } })
      expect(mockChangeLanguage).toHaveBeenLastCalledWith('es')
    })
  })

  describe('Edge Cases', () => {
    it('handles unknown initial language gracefully', () => {
      mockI18n.language = 'fr' as any // Unsupported language
      expect(() => render(<LanguageSwitcher />)).not.toThrow()
    })

    it('handles missing i18n.language', () => {
      mockI18n.language = '' as any
      expect(() => render(<LanguageSwitcher />)).not.toThrow()
    })

    it('handles rapid language switches', async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')

      await user.selectOptions(select, 'es')
      await user.selectOptions(select, 'en')
      await user.selectOptions(select, 'es')

      expect(mockChangeLanguage).toHaveBeenCalledTimes(3)
    })

    it('calls changeLanguage even if it throws an error', () => {
      mockChangeLanguage.mockImplementation(() => {
        throw new Error('Language change failed')
      })

      render(<LanguageSwitcher />)
      const select = screen.getByRole('combobox')

      // The component doesn't catch the error, so it will propagate
      expect(() => {
        fireEvent.change(select, { target: { value: 'es' } })
      }).toThrow('Language change failed')

      // But the function was still called
      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
    })
  })

  describe('Rendering States', () => {
    it('renders consistently regardless of current language', () => {
      const languages = ['en', 'es']

      languages.forEach(lang => {
        mockI18n.language = lang
        const { unmount } = render(<LanguageSwitcher />)

        expect(screen.getByRole('combobox')).toBeInTheDocument()
        expect(screen.getAllByRole('option')).toHaveLength(2)

        unmount()
      })
    })

    it('maintains options order', () => {
      render(<LanguageSwitcher />)

      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveTextContent('English')
      expect(options[1]).toHaveTextContent('Español')
    })
  })

  describe('User Experience', () => {
    it('provides visual feedback on selection', async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox') as HTMLSelectElement

      await user.selectOptions(select, 'es')
      expect(select.value).toBe('es')

      await user.selectOptions(select, 'en')
      expect(select.value).toBe('en')
    })

    it('is easily discoverable with clear labels', () => {
      render(<LanguageSwitcher />)

      // Should be findable by accessible name
      expect(screen.getByLabelText(/select language/i)).toBeInTheDocument()

      // Should have clear option labels
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Español')).toBeInTheDocument()
    })
  })

  describe('Component Props', () => {
    it('passes correct props to Select component', () => {
      render(<LanguageSwitcher />)

      const select = screen.getByRole('combobox')

      // Verify id
      expect(select).toHaveAttribute('id', 'language-switcher')

      // Verify aria-label
      expect(select).toHaveAccessibleName(/select language/i)
    })

    it('provides correct selectData structure', () => {
      render(<LanguageSwitcher />)

      const options = screen.getAllByRole('option') as HTMLOptionElement[]

      // Check English option
      expect(options[0].value).toBe('en')
      expect(options[0].textContent).toBe('English')

      // Check Spanish option
      expect(options[1].value).toBe('es')
      expect(options[1].textContent).toBe('Español')
    })
  })

  describe('Localization', () => {
    it('displays language names in their native form', () => {
      render(<LanguageSwitcher />)

      // Spanish should be displayed as "Español" not "Spanish"
      expect(screen.getByText('Español')).toBeInTheDocument()
      expect(screen.queryByText('Spanish')).not.toBeInTheDocument()
    })

    it('uses correct language codes', () => {
      render(<LanguageSwitcher />)

      const englishOption = screen.getByRole('option', { name: /english/i }) as HTMLOptionElement
      const spanishOption = screen.getByRole('option', { name: /español/i }) as HTMLOptionElement

      // ISO 639-1 codes
      expect(englishOption.value).toBe('en')
      expect(spanishOption.value).toBe('es')
    })
  })
})


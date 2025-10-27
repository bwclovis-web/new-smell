import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SimpleImage from './SimpleImage'

// Mock styleMerge utility
vi.mock('~/utils/styleUtils', () => ({
  styleMerge: (...classes: string[]) => classes.filter(Boolean).join(' ')
}))

describe('SimpleImage', () => {
  describe('Rendering', () => {
    it('should render image with src and alt', () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'test-image.jpg')
      expect(img).toHaveAttribute('alt', 'Test image')
    })

    it('should render with width and height attributes', () => {
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          width={200}
          height={150}
        />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '200')
      expect(img).toHaveAttribute('height', '150')
    })

    it('should apply custom className', () => {
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          className="custom-class"
        />)

      const img = screen.getByRole('img')
      expect(img).toHaveClass('custom-class')
    })

    it('should apply custom style', () => {
      const customStyle = { border: '1px solid red' }
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          style={customStyle}
        />)

      const container = screen.getByRole('img').closest('div')
      expect(container).toHaveStyle('border: 1px solid red')
    })
  })

  describe('Loading states', () => {
    it('should show loading placeholder initially', () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const loadingSpinner = screen.getByRole('img').parentElement?.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('should hide loading placeholder after image loads', async () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')
      const loadingSpinner = img.parentElement?.querySelector('.animate-spin')

      expect(loadingSpinner).toBeInTheDocument()

      // Simulate image load
      fireEvent.load(img)

      await waitFor(() => {
        expect(loadingSpinner).not.toBeInTheDocument()
      })
    })

    it('should show image with opacity transition after load', async () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')

      // Initially hidden
      expect(img).toHaveClass('opacity-0')

      // Simulate image load
      fireEvent.load(img)

      await waitFor(() => {
        expect(img).toHaveClass('opacity-100')
      })
    })
  })

  describe('Error handling', () => {
    it('should show error state when image fails to load', async () => {
      render(<SimpleImage src="invalid-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')

      // Simulate image error
      fireEvent.error(img)

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument()
        expect(screen.queryByRole('img')).not.toBeInTheDocument()
      })
    })

    it('should show error icon in error state', async () => {
      render(<SimpleImage src="invalid-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      await waitFor(() => {
        const errorIcon = screen.getByText('Image unavailable').closest('div')?.querySelector('svg')
        expect(errorIcon).toBeInTheDocument()
      })
    })

    it('should apply custom className to error state', async () => {
      render(<SimpleImage
          src="invalid-image.jpg"
          alt="Test image"
          className="custom-error-class"
        />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      await waitFor(() => {
        const errorContainer = screen.getByText('Image unavailable').closest('div')?.parentElement
        expect(errorContainer).toHaveClass('custom-error-class')
      })
    })

    it('should apply custom style to error state', async () => {
      const customStyle = { backgroundColor: 'red' }
      render(<SimpleImage
          src="invalid-image.jpg"
          alt="Test image"
          style={customStyle}
        />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      await waitFor(() => {
        const errorContainer = screen.getByText('Image unavailable').closest('div')?.parentElement
        expect(errorContainer).toHaveStyle('background-color: red')
      })
    })
  })

  describe('Priority loading', () => {
    it('should set eager loading when priority is true', () => {
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          priority
        />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'eager')
    })

    it('should set lazy loading when priority is false', () => {
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          priority={false}
        />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'lazy')
    })

    it('should set lazy loading by default', () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('Event handlers', () => {
    it('should call onLoad when image loads', () => {
      const onLoad = vi.fn()
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          onLoad={onLoad}
        />)

      const img = screen.getByRole('img')
      fireEvent.load(img)

      expect(onLoad).toHaveBeenCalledTimes(1)
    })

    it('should call onError when image fails to load', () => {
      const onError = vi.fn()
      render(<SimpleImage
          src="invalid-image.jpg"
          alt="Test image"
          onError={onError}
        />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('should not call onLoad when onLoad is not provided', () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')

      // Should not throw error
      expect(() => fireEvent.load(img)).not.toThrow()
    })

    it('should not call onError when onError is not provided', () => {
      render(<SimpleImage src="invalid-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')

      // Should not throw error
      expect(() => fireEvent.error(img)).not.toThrow()
    })
  })

  describe('Image attributes', () => {
    it('should set decoding to async', () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('decoding', 'async')
    })

    it('should set contain style for performance', () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')
      expect(img).toHaveStyle('contain: layout style paint')
    })

    it('should have transition opacity classes', () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const img = screen.getByRole('img')
      expect(img).toHaveClass('transition-opacity', 'duration-300')
    })
  })

  describe('Container structure', () => {
    it('should wrap image in relative container', () => {
      render(<SimpleImage src="test-image.jpg" alt="Test image" />)

      const container = screen.getByRole('img').closest('div')
      expect(container).toHaveClass('relative', 'overflow-hidden')
    })

    it('should apply custom style to container', () => {
      const customStyle = { border: '1px solid blue' }
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          style={customStyle}
        />)

      const container = screen.getByRole('img').closest('div')
      expect(container).toHaveStyle('border: 1px solid blue')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty src', () => {
      render(<SimpleImage src="" alt="Test image" />)

      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
    })

    it('should handle empty alt', () => {
      render(<SimpleImage src="test-image.jpg" alt="" />)

      const img = screen.getByRole('presentation')
      expect(img).toBeInTheDocument()
    })

    it('should handle zero width and height', () => {
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          width={0}
          height={0}
        />)

      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
    })

    it('should handle undefined width and height', () => {
      render(<SimpleImage
          src="test-image.jpg"
          alt="Test image"
          width={undefined}
          height={undefined}
        />)

      const img = screen.getByRole('img')
      expect(img).not.toHaveAttribute('width')
      expect(img).not.toHaveAttribute('height')
    })
  })
})

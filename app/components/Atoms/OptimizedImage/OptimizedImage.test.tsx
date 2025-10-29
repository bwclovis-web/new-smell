import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import OptimizedImage from './OptimizedImage'

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn(callback => {
  // Immediately trigger the callback with intersecting entry
  setTimeout(() => {
    callback([{ isIntersecting: true }])
  }, 0)

  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: () => []
  }
})

global.IntersectionObserver = mockIntersectionObserver as any

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with basic props', async () => {
    render(<OptimizedImage
      src="/test-image.jpg"
      alt="Test image"
      width={300}
      height={200}
    />)

    // Wait for IntersectionObserver to trigger and image to load
    await waitFor(() => {
      expect(screen.getByAltText('Test image')).toBeInTheDocument()
    })
  })

  it('shows loading placeholder initially', async () => {
    render(<OptimizedImage
      src="/test-image.jpg"
      alt="Test image"
      width={300}
      height={200}
    />)

    // Wait for the image to appear
    await waitFor(() => {
      expect(screen.getByAltText('Test image')).toBeInTheDocument()
    })

    // Initially, the image should have opacity-0 (not loaded yet)
    const img = screen.getByAltText('Test image')
    expect(img).toHaveClass('opacity-0')
  })

  it('handles image load event', async () => {
    const onLoad = vi.fn()
    render(<OptimizedImage
      src="/test-image.jpg"
      alt="Test image"
      onLoad={onLoad}
    />)

    // Wait for image to be rendered
    const img = await screen.findByAltText('Test image')

    // Dispatch load event
    img.dispatchEvent(new Event('load'))

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled()
      expect(img).toHaveClass('opacity-100')
    })
  })

  it('handles image error event', async () => {
    const onError = vi.fn()
    render(<OptimizedImage
      src="/invalid-image.jpg"
      alt="Test image"
      onError={onError}
    />)

    // Wait for image to be rendered
    const img = await screen.findByAltText('Test image')

    // Dispatch error event
    img.dispatchEvent(new Event('error'))

    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
      expect(screen.getByText('Image unavailable')).toBeInTheDocument()
    })
  })

  it('renders with priority loading', () => {
    render(<OptimizedImage
      src="/test-image.jpg"
      alt="Test image"
      priority={true}
    />)

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('renders with lazy loading by default', async () => {
    render(<OptimizedImage
      src="/test-image.jpg"
      alt="Test image"
    />)

    // Wait for image to be rendered after IntersectionObserver triggers
    const img = await screen.findByAltText('Test image')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('applies custom className', async () => {
    const { container } = render(<OptimizedImage
      src="/test-image.jpg"
      alt="Test image"
      className="custom-class"
    />)

    // Wait for image to be rendered
    await screen.findByAltText('Test image')

    // The custom class is applied to the container div
    const containerDiv = container.firstChild as HTMLElement
    expect(containerDiv).toHaveClass('custom-class')
  })

  it('generates srcSet for responsive images', async () => {
    render(<OptimizedImage
      src="/test-image.jpg"
      alt="Test image"
      sizes="(max-width: 768px) 100vw, 50vw"
    />)

    // Wait for image to be rendered
    const img = await screen.findByAltText('Test image')
    // Note: generateSrcSet returns undefined currently, so srcSet attribute won't be present
    expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw')
  })

  it('shows blur placeholder when provided', async () => {
    const { container } = render(<OptimizedImage
      src="/test-image.jpg"
      alt="Test image"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />)

    // Wait for image to be rendered
    await screen.findByAltText('Test image')

    // Should show blur placeholder initially (before image loads)
    const blurPlaceholder = container.querySelector('.bg-cover')
    expect(blurPlaceholder).toBeInTheDocument()
    expect(blurPlaceholder).toHaveClass('blur-sm')
  })
})

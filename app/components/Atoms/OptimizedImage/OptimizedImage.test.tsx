import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OptimizedImage from './OptimizedImage'

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})
window.IntersectionObserver = mockIntersectionObserver

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with basic props', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    )

    expect(screen.getByAltText('Test image')).toBeInTheDocument()
  })

  it('shows loading placeholder initially', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    )

    expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
  })

  it('handles image load event', async () => {
    const onLoad = vi.fn()
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        onLoad={onLoad}
      />
    )

    const img = screen.getByAltText('Test image')
    img.dispatchEvent(new Event('load'))

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled()
    })
  })

  it('handles image error event', async () => {
    const onError = vi.fn()
    render(
      <OptimizedImage
        src="/invalid-image.jpg"
        alt="Test image"
        onError={onError}
      />
    )

    const img = screen.getByAltText('Test image')
    img.dispatchEvent(new Event('error'))

    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
      expect(screen.getByText('Image unavailable')).toBeInTheDocument()
    })
  })

  it('renders with priority loading', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    )

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('renders with lazy loading by default', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
      />
    )

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('applies custom className', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
      />
    )

    expect(screen.getByRole('generic')).toHaveClass('custom-class')
  })

  it('generates srcSet for responsive images', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    )

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('srcSet')
    expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw')
  })

  it('shows blur placeholder when provided', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />
    )

    // Should show blur placeholder initially
    expect(screen.getByRole('generic')).toHaveClass('bg-cover')
  })
})

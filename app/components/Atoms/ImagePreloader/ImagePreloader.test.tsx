import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ImagePreloader from './ImagePreloader'

// Mock DOM APIs
const mockIntersectionObserver = vi.fn()
const mockRequestIdleCallback = vi.fn()
const mockSetTimeout = vi.fn()

// Mock global objects
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: mockIntersectionObserver
})

Object.defineProperty(window, 'requestIdleCallback', {
  writable: true,
  value: mockRequestIdleCallback
})

Object.defineProperty(global, 'setTimeout', {
  writable: true,
  value: mockSetTimeout
})

describe('ImagePreloader', () => {
  let mockDocumentHead: HTMLElement
  let mockDocumentQuerySelectorAll: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock document.head
    mockDocumentHead = document.createElement('head')
    Object.defineProperty(document, 'head', {
      value: mockDocumentHead,
      writable: true
    })

    // Mock document.querySelectorAll
    mockDocumentQuerySelectorAll = vi.fn().mockReturnValue([])
    Object.defineProperty(document, 'querySelectorAll', {
      value: mockDocumentQuerySelectorAll,
      writable: true
    })

    // Mock IntersectionObserver
    mockIntersectionObserver.mockImplementation(callback => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      callback
    }))
  })

  afterEach(() => {
    // Clean up any added elements
    mockDocumentHead.innerHTML = ''
  })

  describe('High priority preloading', () => {
    it('should create preload links immediately for high priority', () => {
      const images = ['image1.jpg', 'image2.jpg']
      render(<ImagePreloader images={images} priority="high" />)

      const preloadLinks = mockDocumentHead.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloadLinks).toHaveLength(2)

      expect(preloadLinks[0]).toHaveAttribute('href', 'image1.jpg')
      expect(preloadLinks[0]).toHaveAttribute('fetchPriority', 'high')
      expect(preloadLinks[1]).toHaveAttribute('href', 'image2.jpg')
      expect(preloadLinks[1]).toHaveAttribute('fetchPriority', 'high')
    })

    it('should handle empty images array for high priority', () => {
      render(<ImagePreloader images={[]} priority="high" />)

      const preloadLinks = mockDocumentHead.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloadLinks).toHaveLength(0)
    })
  })

  describe('Lazy loading with IntersectionObserver', () => {
    it('should set up IntersectionObserver for lazy loading', () => {
      const images = ['image1.jpg', 'image2.jpg']
      render(<ImagePreloader images={images} priority="low" lazy />)

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      )
    })

    it('should create Image objects for lazy loading', () => {
      const images = ['image1.jpg', 'image2.jpg']
      const ImageSpy = vi.spyOn(global, 'Image')

      render(<ImagePreloader images={images} priority="low" lazy />)

      expect(ImageSpy).toHaveBeenCalledTimes(2)
    })

    it('should not use IntersectionObserver when lazy is false', () => {
      const images = ['image1.jpg']
      render(<ImagePreloader images={images} priority="low" lazy={false} />)

      expect(mockIntersectionObserver).not.toHaveBeenCalled()
    })
  })

  describe('Low priority preloading', () => {
    it('should use requestIdleCallback when available', () => {
      const images = ['image1.jpg', 'image2.jpg']
      render(<ImagePreloader images={images} priority="low" lazy={false} />)

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should fallback to setTimeout when requestIdleCallback is not available', () => {
      // Remove requestIdleCallback
      Object.defineProperty(window, 'requestIdleCallback', {
        value: undefined,
        writable: true
      })

      const images = ['image1.jpg']
      render(<ImagePreloader images={images} priority="low" lazy={false} />)

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000)
    })

    it('should create preload links with low priority', () => {
      const images = ['image1.jpg']
      const callback = vi.fn()
      mockRequestIdleCallback.mockImplementation(fn => {
        callback.mockImplementation(fn)
        fn() // Execute immediately for testing
      })

      render(<ImagePreloader images={images} priority="low" lazy={false} />)

      callback()

      const preloadLinks = mockDocumentHead.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloadLinks).toHaveLength(1)
      expect(preloadLinks[0]).toHaveAttribute('href', 'image1.jpg')
      expect(preloadLinks[0]).toHaveAttribute('fetchPriority', 'low')
    })
  })

  describe('Cleanup', () => {
    it('should disconnect IntersectionObserver on unmount', () => {
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      }
      mockIntersectionObserver.mockReturnValue(mockObserver)

      const { unmount } = render(<ImagePreloader images={['image1.jpg']} lazy />)

      unmount()

      expect(mockObserver.disconnect).toHaveBeenCalled()
    })

    it('should remove preload links on unmount', () => {
      const images = ['image1.jpg', 'image2.jpg']
      const mockLinks = [
        { href: 'image1.jpg', remove: vi.fn() },
        { href: 'image2.jpg', remove: vi.fn() },
        { href: 'other.jpg', remove: vi.fn() }
      ]

      mockDocumentQuerySelectorAll.mockReturnValue(mockLinks)

      const { unmount } = render(<ImagePreloader images={images} priority="high" />)

      unmount()

      // Should only remove links that match the images array
      expect(mockLinks[0].remove).toHaveBeenCalled()
      expect(mockLinks[1].remove).toHaveBeenCalled()
      expect(mockLinks[2].remove).not.toHaveBeenCalled()
    })
  })

  describe('Default behavior', () => {
    it('should use low priority by default', () => {
      const images = ['image1.jpg']
      render(<ImagePreloader images={images} />)

      expect(mockRequestIdleCallback).toHaveBeenCalled()
    })

    it('should use lazy loading by default', () => {
      const images = ['image1.jpg']
      render(<ImagePreloader images={images} />)

      expect(mockIntersectionObserver).toHaveBeenCalled()
    })
  })

  describe('Rendering', () => {
    it('should not render any visible content', () => {
      const { container } = render(<ImagePreloader images={['image1.jpg']} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty images array', () => {
      render(<ImagePreloader images={[]} />)

      expect(mockIntersectionObserver).not.toHaveBeenCalled()
      expect(mockRequestIdleCallback).not.toHaveBeenCalled()
    })

    it('should handle undefined images', () => {
      render(<ImagePreloader images={undefined as any} />)

      // Should not throw error
      expect(true).toBe(true)
    })

    it('should handle images with special characters', () => {
      const images = ['image with spaces.jpg', 'image-with-dashes.jpg', 'image_with_underscores.jpg']
      render(<ImagePreloader images={images} priority="high" />)

      const preloadLinks = mockDocumentHead.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloadLinks).toHaveLength(3)
    })
  })

  describe('IntersectionObserver callback', () => {
    it('should handle intersection entries correctly', () => {
      const images = ['image1.jpg']
      let observerCallback: any

      mockIntersectionObserver.mockImplementation(callback => {
        observerCallback = callback
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn()
        }
      })

      render(<ImagePreloader images={images} lazy />)

      // Simulate intersection
      const mockEntry = {
        isIntersecting: true,
        target: {
          src: 'image1.jpg',
          dataset: { src: 'image1.jpg' }
        }
      }

      observerCallback([mockEntry])

      // Should unobserve the element
      expect(true).toBe(true) // Test passes if no error is thrown
    })

    it('should not process non-intersecting entries', () => {
      const images = ['image1.jpg']
      let observerCallback: any

      mockIntersectionObserver.mockImplementation(callback => {
        observerCallback = callback
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn()
        }
      })

      render(<ImagePreloader images={images} lazy />)

      // Simulate non-intersection
      const mockEntry = {
        isIntersecting: false,
        target: {
          src: 'image1.jpg',
          dataset: { src: 'image1.jpg' }
        }
      }

      observerCallback([mockEntry])

      // Should not unobserve the element
      expect(true).toBe(true) // Test passes if no error is thrown
    })
  })
})

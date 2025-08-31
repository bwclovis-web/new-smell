// Image optimization utilities

export interface ImageSize {
  width: number
  height: number
}

export interface OptimizedImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

/**
 * Generate responsive srcSet for different screen sizes
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[],
  options: OptimizedImageOptions = {}
): string {
  if (!baseUrl || baseUrl.startsWith('data:') || baseUrl.startsWith('blob:')) {
    return ''
  }

  // For external URLs, return empty string to use original
  if (baseUrl.startsWith('http')) {
    return ''
  }

  return sizes
    .map(size => {
      const optimizedUrl = generateOptimizedUrl(baseUrl, { ...options, width: size })
      return `${optimizedUrl} ${size}w`
    })
    .join(', ')
}

/**
 * Generate optimized image URL with parameters
 */
export function generateOptimizedUrl(
  baseUrl: string,
  options: OptimizedImageOptions = {}
): string {
  if (!baseUrl) return ''

  // For external URLs, return original
  if (baseUrl.startsWith('http')) {
    return baseUrl
  }

  // For local images, you could add optimization parameters
  // This would require a build-time or runtime image processing service
  const params = new URLSearchParams()

  if (options.width) params.append('w', options.width.toString())
  if (options.height) params.append('h', options.height.toString())
  if (options.quality) params.append('q', options.quality.toString())
  if (options.format) params.append('f', options.format)
  if (options.fit) params.append('fit', options.fit)

  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
}

/**
 * Calculate optimal image dimensions based on container and aspect ratio
 */
export function calculateOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number = 1
): ImageSize {
  if (containerWidth && containerHeight) {
    const containerAspect = containerWidth / containerHeight

    if (containerAspect > aspectRatio) {
      // Container is wider than image
      return {
        width: Math.round(containerHeight * aspectRatio),
        height: containerHeight
      }
    } else {
      // Container is taller than image
      return {
        width: containerWidth,
        height: Math.round(containerWidth / aspectRatio)
      }
    }
  }

  return { width: containerWidth, height: containerHeight }
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(
  breakpoints: { [key: string]: number } = {
    'sm': 640,
    'md': 768,
    'lg': 1024,
    'xl': 1280,
    '2xl': 1536
  }
): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, width]) => {
      if (breakpoint === '2xl') {
        return `${width}px`
      }
      return `(min-width: ${width}px) ${width}px`
    })
    .join(', ')
}

/**
 * Check if image format is supported by the browser
 */
export function isFormatSupported(format: string): boolean {
  if (typeof window === 'undefined') return true

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  try {
    return canvas.toDataURL(`image/${format}`) !== 'data:,'
  } catch {
    return false
  }
}

/**
 * Get the best supported format for the browser
 */
export function getBestSupportedFormat(
  preferredFormats: string[] = ['webp', 'avif', 'jpeg']
): string {
  for (const format of preferredFormats) {
    if (isFormatSupported(format)) {
      return format
    }
  }
  return 'jpeg' // Fallback
}

/**
 * Generate a low-quality placeholder URL for blur effect
 */
export function generateBlurPlaceholder(
  baseUrl: string,
  width: number = 20,
  quality: number = 10
): string {
  return generateOptimizedUrl(baseUrl, {
    width,
    quality,
    format: 'jpeg'
  })
}

/**
 * Preload image for better performance
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  link.fetchPriority = priority
  document.head.appendChild(link)
}

/**
 * Batch preload multiple images
 */
export function preloadImages(
  images: string[],
  priority: 'high' | 'low' = 'low'
): void {
  if (priority === 'high') {
    images.forEach(src => preloadImage(src, 'high'))
  } else {
    // Use requestIdleCallback for low priority preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        images.forEach(src => preloadImage(src, 'low'))
      })
    } else {
      // Fallback for older browsers
      setTimeout(() => {
        images.forEach(src => preloadImage(src, 'low'))
      }, 1000)
    }
  }
}

/**
 * Image optimization utilities for format conversion and compression
 */

export interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

/**
 * Generates optimized image URLs with different formats and sizes
 * This is a placeholder for integration with image optimization services
 * like Cloudinary, ImageKit, or Next.js Image Optimization
 */
export const getOptimizedImageUrl = (
  src: string,
  options: ImageOptimizationOptions = {}
): string => {
  const {
    quality = 75,
    format = 'webp',
    width,
    height,
    fit = 'cover'
  } = options

  // For local images, return as-is for now
  // In production, this would integrate with an image optimization service
  if (src.startsWith('/') || src.startsWith('./')) {
    return src
  }

  // For external images, you could add optimization parameters here
  // Example for Cloudinary:
  // return `https://res.cloudinary.com/your-cloud/image/fetch/q_${quality},f_${format},w_${width},h_${height},c_${fit}/${encodeURIComponent(src)}`

  // Example for ImageKit:
  // return `https://ik.imagekit.io/your-imagekit-id/tr:q-${quality},f-${format},w-${width},h-${height},c-${fit}/${src}`

  return src
}

/**
 * Generates responsive image srcSet for different screen sizes
 */
export const generateResponsiveSrcSet = (
  baseSrc: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1536, 1920]
): string => {
  if (!baseSrc) return ''

  const baseUrl = baseSrc.replace(/\.[^/.]+$/, '')
  const extension = baseSrc.split('.').pop() || 'jpg'

  return sizes
    .map(size => `${baseUrl}-${size}w.${extension} ${size}w`)
    .join(', ')
}

/**
 * Generates appropriate sizes attribute for responsive images
 */
export const generateSizesAttribute = (
  breakpoints: { maxWidth: number; size: string }[] = [
    { maxWidth: 640, size: '100vw' },
    { maxWidth: 768, size: '50vw' },
    { maxWidth: 1024, size: '33vw' },
    { maxWidth: 1280, size: '25vw' }
  ]
): string => {
  return breakpoints
    .map(bp => `(max-width: ${bp.maxWidth}px) ${bp.size}`)
    .join(', ') + ', 20vw'
}

/**
 * Determines if an image should be loaded with priority
 */
export const shouldLoadWithPriority = (
  src: string,
  context: 'hero' | 'above-fold' | 'below-fold' | 'lazy' = 'lazy'
): boolean => {
  return context === 'hero' || context === 'above-fold'
}

/**
 * Generates a blur data URL for placeholder images
 */
export const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Create a simple gradient blur
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.1)
}

/**
 * Preloads critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
    img.src = src
  })
}

/**
 * Preloads multiple images
 */
export const preloadImages = async (srcs: string[]): Promise<void> => {
  const promises = srcs.map(preloadImage)
  await Promise.allSettled(promises)
}

/**
 * Gets the appropriate image format based on browser support
 */
export const getOptimalImageFormat = (): 'webp' | 'avif' | 'jpeg' => {
  // Check for AVIF support
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (ctx) {
      try {
        ctx.drawImage(new Image(), 0, 0)
        // AVIF is supported
        return 'avif'
      } catch (e) {
        // AVIF not supported, check for WebP
      }
    }
  }

  // Check for WebP support
  if (typeof window !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'jpeg'
  }

  return 'jpeg'
}

/**
 * Calculates the optimal image dimensions based on container size and device pixel ratio
 */
export const calculateOptimalDimensions = (
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = 1
): { width: number; height: number } => {
  return {
    width: Math.ceil(containerWidth * devicePixelRatio),
    height: Math.ceil(containerHeight * devicePixelRatio)
  }
}
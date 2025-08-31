import { useState, useRef, useEffect } from 'react'
import { useInView } from '~/hooks/useInView'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes = '100vw',
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc = '/placeholder-perfume.jpg'
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use intersection observer for lazy loading
  const inView = useInView(containerRef, {
    threshold: 0.1,
    rootMargin: '50px'
  })

  useEffect(() => {
    if (inView && !isInView) {
      setIsInView(true)
    }
  }, [inView, isInView])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc)
      setHasError(true)
    }
    onError?.()
  }

  const handleImageLoad = () => {
    if (imgRef.current?.complete) {
      handleLoad()
    }
  }

  // Generate responsive srcSet for different screen sizes
  const generateSrcSet = (imageUrl: string) => {
    if (!imageUrl || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      return undefined
    }

    // For external URLs, return undefined to use the original
    if (imageUrl.startsWith('http')) {
      return undefined
    }

    // For local images, you could generate different sizes
    // This would require a build-time image processing step
    return undefined
  }

  const srcSet = generateSrcSet(imageSrc)

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && !blurDataURL && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          srcSet={srcSet}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`
            transition-opacity duration-300 ease-in-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          onLoad={handleImageLoad}
          onError={handleError}
          style={{
            contain: 'layout style paint'
          }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default OptimizedImage

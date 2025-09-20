import React, { useState } from 'react'
import { styleMerge } from '~/utils/styleUtils'

interface SimpleImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  style?: React.CSSProperties
}

const SimpleImage: React.FC<SimpleImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  onLoad,
  onError,
  style
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div
        className={styleMerge('flex items-center justify-center bg-gray-100', className)}
        style={{ width, height, ...style }}
      >
        <div className="text-gray-400 text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">Image unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden" style={style}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        {...(width && { width })}
        {...(height && { height })}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={styleMerge(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          contain: 'layout style paint'
        }}
      />
    </div>
  )
}

export default SimpleImage

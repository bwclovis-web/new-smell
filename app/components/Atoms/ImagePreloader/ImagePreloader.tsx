import { useEffect } from 'react'

interface ImagePreloaderProps {
  images: string[]
  priority?: 'high' | 'low'
}

const ImagePreloader = ({ images, priority = 'low' }: ImagePreloaderProps) => {
  useEffect(() => {
    if (priority === 'high') {
      // High priority: preload immediately
      images.forEach((src) => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        link.fetchPriority = 'high'
        document.head.appendChild(link)
      })
    } else {
      // Low priority: preload when idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          images.forEach((src) => {
            const link = document.createElement('link')
            link.rel = 'preload'
            link.as = 'image'
            link.href = src
            link.fetchPriority = 'low'
            document.head.appendChild(link)
          })
        })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          images.forEach((src) => {
            const link = document.createElement('link')
            link.rel = 'preload'
            link.as = 'image'
            link.href = src
            link.fetchPriority = 'low'
            document.head.appendChild(link)
          })
        }, 1000)
      }
    }

    // Cleanup function
    return () => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]')
      preloadLinks.forEach((link) => {
        if (images.includes((link as HTMLLinkElement).href)) {
          link.remove()
        }
      })
    }
  }, [images, priority])

  return null // This component doesn't render anything
}

export default ImagePreloader

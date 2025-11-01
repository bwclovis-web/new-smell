import { useEffect, useRef } from "react"

interface ImagePreloaderProps {
  images: string[]
  priority?: "high" | "low"
  lazy?: boolean
}

const ImagePreloader = ({
  images,
  priority = "low",
  lazy = true,
}: ImagePreloaderProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Early return if images is empty or undefined
    if (!images || images.length === 0) {
      return
    }

    if (priority === "high") {
      // High priority: preload immediately
      images.forEach((src) => {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "image"
        link.href = src
        link.setAttribute("fetchpriority", "high")
        document.head.appendChild(link)
      })
    } else if (lazy && "IntersectionObserver" in window) {
      // Lazy loading with Intersection Observer
      const imageElements = images.map((src) => {
        const img = new Image()
        img.src = src
        img.loading = "lazy"
        img.decoding = "async"
        return img
      })

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              img.src = img.dataset.src || img.src
              observerRef.current?.unobserve(img)
            }
          })
        },
        {
          rootMargin: "50px 0px",
          threshold: 0.1,
        }
      )

      imageElements.forEach((img) => {
        if (observerRef.current) {
          observerRef.current.observe(img)
        }
      })
    } else {
      // Low priority: preload when idle
      if (
        "requestIdleCallback" in window &&
        typeof window.requestIdleCallback === "function"
      ) {
        window.requestIdleCallback(() => {
          images.forEach((src) => {
            const link = document.createElement("link")
            link.rel = "preload"
            link.as = "image"
            link.href = src
            link.setAttribute("fetchpriority", "low")
            document.head.appendChild(link)
          })
        })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          images.forEach((src) => {
            const link = document.createElement("link")
            link.rel = "preload"
            link.as = "image"
            link.href = src
            link.setAttribute("fetchpriority", "low")
            document.head.appendChild(link)
          })
        }, 1000)
      }
    }

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      const preloadLinks = document.querySelectorAll(
        'link[rel="preload"][as="image"]'
      )
      preloadLinks.forEach((link) => {
        if (images.includes((link as HTMLLinkElement).href)) {
          link.remove()
        }
      })
    }
  }, [images, priority, lazy])

  return null // This component doesn't render anything
}

export default ImagePreloader

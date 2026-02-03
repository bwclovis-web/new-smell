import { useEffect, useState } from "react"

/**
 * Custom hook for matching media queries
 * 
 * @param query - Media query string (e.g., "(min-width: 768px)")
 * @returns Boolean indicating if the media query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  return matches
}

/**
 * Hook to get responsive page size based on Tailwind breakpoints
 * - Mobile (< md): 4 items
 * - Tablet (md to < lg): 8 items  
 * - Desktop (lg+): 16 items
 * 
 * @returns Page size based on current screen size
 */
export const useResponsivePageSize = (): number => {
  const isTablet = useMediaQuery("(min-width: 768px)")
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  if (isDesktop) {
    return 16
  }
  if (isTablet) {
    return 8
  }
  return 6
}

export default useMediaQuery

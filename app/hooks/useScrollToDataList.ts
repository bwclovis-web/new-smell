import { useEffect, useRef } from "react"

interface UseScrollToDataListOptions {
  trigger: string | number | null
  enabled?: boolean
  isLoading?: boolean
  hasData?: boolean
  delay?: number
}

export function useScrollToDataList({
  trigger,
  enabled = true,
  isLoading = false,
  hasData = false,
  delay = 200,
}: UseScrollToDataListOptions) {
  const previousTriggerRef = useRef<string | number | null>(null)
  const scrollAttemptedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track when trigger changes to reset scroll flag
  useEffect(() => {
    if (!enabled || !trigger) {
      scrollAttemptedRef.current = false
      previousTriggerRef.current = trigger
      return
    }

    const triggerChanged = previousTriggerRef.current !== trigger
    if (triggerChanged) {
      scrollAttemptedRef.current = false
      previousTriggerRef.current = trigger
    }
  }, [trigger, enabled])

  // Scroll when data is ready (after loading completes)
  useEffect(() => {
    if (!enabled || !trigger || isLoading || !hasData || scrollAttemptedRef.current) {
      return
    }

    const scrollToElement = () => {
      const dataListElement = document.getElementById("data-list")
      if (dataListElement) {
        // Check if element has content (children)
        const ulElement = dataListElement.querySelector("ul")
        const hasContent = (ulElement?.children.length ?? 0) > 0
        
        if (hasContent) {
          dataListElement.scrollIntoView({ 
            behavior: "smooth", 
            block: "start",
          })
          
          scrollAttemptedRef.current = true
          return true
        }
      }
      return false
    }

    // Use requestAnimationFrame to ensure DOM is painted, then scroll
    const rafId = requestAnimationFrame(() => {
      timeoutRef.current = setTimeout(() => {
        // Double-check conditions before scrolling
        if (!isLoading && hasData && !scrollAttemptedRef.current) {
          scrollToElement()
        }
      }, delay)
    })

    return () => {
      cancelAnimationFrame(rafId)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [trigger, enabled, isLoading, hasData, delay])
}


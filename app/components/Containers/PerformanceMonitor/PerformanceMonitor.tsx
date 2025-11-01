import { useEffect } from "react"

const PerformanceMonitor = () => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      return
    }

    // Track Core Web Vitals
    if ("PerformanceObserver" in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          console.log("LCP:", lastEntry.startTime)
          // Send to analytics service
          if (window.gtag) {
            window.gtag("event", "LCP", {
              value: Math.round(lastEntry.startTime),
              event_category: "Web Vitals",
            })
          }
        }
      })
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          console.log("FID:", entry.processingStart - entry.startTime)
          if (window.gtag) {
            window.gtag("event", "FID", {
              value: Math.round(entry.processingStart - entry.startTime),
              event_category: "Web Vitals",
            })
          }
        })
      })
      fidObserver.observe({ entryTypes: ["first-input"] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            console.log("CLS:", clsValue)
            if (window.gtag) {
              window.gtag("event", "CLS", {
                value: Math.round(clsValue * 1000) / 1000,
                event_category: "Web Vitals",
              })
            }
          }
        })
      })
      clsObserver.observe({ entryTypes: ["layout-shift"] })

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstEntry = entries[0]
        if (firstEntry) {
          console.log("FCP:", firstEntry.startTime)
          if (window.gtag) {
            window.gtag("event", "FCP", {
              value: Math.round(firstEntry.startTime),
              event_category: "Web Vitals",
            })
          }
        }
      })
      fcpObserver.observe({ entryTypes: ["first-contentful-paint"] })

      // Time to Interactive (TTI) - using longtask instead of interaction
      const ttiObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          console.log("TTI:", entry.startTime)
          if (window.gtag) {
            window.gtag("event", "TTI", {
              value: Math.round(entry.startTime),
              event_category: "Web Vitals",
            })
          }
        })
      })
      ttiObserver.observe({ entryTypes: ["longtask"] })

      // Cleanup
      return () => {
        lcpObserver.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
        fcpObserver.disconnect()
        ttiObserver.disconnect()
      }
    }

    // Track page load performance
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType(
            "navigation"
          )[0] as PerformanceNavigationTiming
          if (navigation) {
            const metrics = {
              dns: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp: navigation.connectEnd - navigation.connectStart,
              ttfb: navigation.responseStart - navigation.requestStart,
              domContentLoaded:
                navigation.domContentLoadedEventEnd - navigation.navigationStart,
              loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            }

            console.log("Performance Metrics:", metrics)

            // Send to analytics
            if (window.gtag) {
              Object.entries(metrics).forEach(([key, value]) => {
                window.gtag("event", "performance", {
                  metric_name: key,
                  value: Math.round(value),
                  event_category: "Performance",
                })
              })
            }
          }
        }, 0)
      })
    }
  }, [])

  return null
}

export default PerformanceMonitor

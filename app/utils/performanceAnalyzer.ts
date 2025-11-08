/**
 * Performance Analyzer Utility
 * 
 * Analyzes and reports performance metrics for the live site.
 * Can be used in development and production to identify bottlenecks.
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  
  // Resource metrics
  imageLoadTimes: Array<{ src: string; loadTime: number; size: number }>
  scriptLoadTimes: Array<{ src: string; loadTime: number; size: number }>
  stylesheetLoadTimes: Array<{ src: string; loadTime: number; size: number }>
  
  // React performance
  componentRenderCounts: Record<string, number>
  renderTime: number
  
  // Network
  totalBytes: number
  totalRequests: number
  slowRequests: Array<{ url: string; duration: number; size: number }>
  
  // Memory
  memoryUsage?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export interface PerformanceReport {
  timestamp: number
  url: string
  metrics: PerformanceMetrics
  issues: PerformanceIssue[]
  recommendations: string[]
}

export interface PerformanceIssue {
  type: "warning" | "error" | "info"
  category: "images" | "scripts" | "styles" | "network" | "react" | "core-web-vitals"
  message: string
  impact: "low" | "medium" | "high"
  fix?: string
}

class PerformanceAnalyzer {
  private metrics: PerformanceMetrics = {
    imageLoadTimes: [],
    scriptLoadTimes: [],
    stylesheetLoadTimes: [],
    componentRenderCounts: {},
    renderTime: 0,
    totalBytes: 0,
    totalRequests: 0,
    slowRequests: [],
  }

  private observers: PerformanceObserver[] = []

  /**
   * Initialize performance monitoring
   */
  init() {
    if (typeof window === "undefined") {
      return
    }

    this.observeResourceTiming()
    this.observePaintTiming()
    this.observeLayoutShift()
    this.observeLargestContentfulPaint()
    this.observeFirstInputDelay()
    
    // Measure initial page load
    if (document.readyState === "complete") {
      this.measurePageLoad()
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => this.measurePageLoad(), 0)
      })
    }
  }

  /**
   * Collect all performance data and generate report
   */
  collect(): PerformanceReport {
    this.collectCoreWebVitals()
    this.collectResourceMetrics()
    this.collectMemoryUsage()
    
    const issues = this.analyzeIssues()
    const recommendations = this.generateRecommendations(issues)

    return {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: { ...this.metrics },
      issues,
      recommendations,
    }
  }

  /**
   * Observe resource timing (images, scripts, stylesheets)
   */
  private observeResourceTiming() {
    if (!("PerformanceObserver" in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming
          const duration = resourceEntry.responseEnd - resourceEntry.requestStart
          const size = resourceEntry.transferSize || 0

          this.metrics.totalRequests++
          this.metrics.totalBytes += size

          // Track slow requests
          if (duration > 1000) {
            this.metrics.slowRequests.push({
              url: resourceEntry.name,
              duration,
              size,
            })
          }

          // Categorize by resource type
          if (resourceEntry.initiatorType === "img") {
            this.metrics.imageLoadTimes.push({
              src: resourceEntry.name,
              loadTime: duration,
              size,
            })
          } else if (resourceEntry.initiatorType === "script") {
            this.metrics.scriptLoadTimes.push({
              src: resourceEntry.name,
              loadTime: duration,
              size,
            })
          } else if (resourceEntry.initiatorType === "link" && resourceEntry.name.includes(".css")) {
            this.metrics.stylesheetLoadTimes.push({
              src: resourceEntry.name,
              loadTime: duration,
              size,
            })
          }
        }
      })

      observer.observe({ entryTypes: ["resource"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("PerformanceObserver not supported for resources", e)
    }
  }

  /**
   * Observe paint timing (FCP, LCP)
   */
  private observePaintTiming() {
    if (!("PerformanceObserver" in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const paintEntry = entry as PerformancePaintTiming
          if (paintEntry.name === "first-contentful-paint") {
            this.metrics.fcp = paintEntry.startTime
          }
        }
      })

      observer.observe({ entryTypes: ["paint"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("PerformanceObserver not supported for paint", e)
    }
  }

  /**
   * Observe layout shifts (CLS)
   */
  private observeLayoutShift() {
    if (!("PerformanceObserver" in window)) {
      return
    }

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value
          }
        }
        this.metrics.cls = clsValue
      })

      observer.observe({ entryTypes: ["layout-shift"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("PerformanceObserver not supported for layout-shift", e)
    }
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  private observeLargestContentfulPaint() {
    if (!("PerformanceObserver" in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime: number; loadTime: number }
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime
      })

      observer.observe({ entryTypes: ["largest-contentful-paint"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("PerformanceObserver not supported for largest-contentful-paint", e)
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  private observeFirstInputDelay() {
    if (!("PerformanceObserver" in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming
          if (!this.metrics.fid) {
            this.metrics.fid = fidEntry.processingStart - fidEntry.startTime
          }
        }
      })

      observer.observe({ entryTypes: ["first-input"] })
      this.observers.push(observer)
    } catch (e) {
      console.warn("PerformanceObserver not supported for first-input", e)
    }
  }

  /**
   * Measure page load performance
   */
  private measurePageLoad() {
    if (performance.timing) {
      const timing = performance.timing
      this.metrics.ttfb = timing.responseStart - timing.navigationStart
    }

    // Use Navigation Timing API v2 if available
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]
      if (navEntries.length > 0) {
        const nav = navEntries[0]
        this.metrics.ttfb = nav.responseStart - nav.requestStart
      }
    }
  }

  /**
   * Collect Core Web Vitals from existing metrics
   */
  private collectCoreWebVitals() {
    // Metrics are already collected by observers
    // This is a placeholder for any additional collection needed
  }

  /**
   * Collect resource metrics
   */
  private collectResourceMetrics() {
    // Resources are already collected by observers
    // Sort slow requests by duration
    this.metrics.slowRequests.sort((a, b) => b.duration - a.duration)
  }

  /**
   * Collect memory usage (if available)
   */
  private collectMemoryUsage() {
    if ("memory" in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      }
    }
  }

  /**
   * Analyze collected metrics and identify issues
   */
  private analyzeIssues(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    // Core Web Vitals checks
    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      issues.push({
        type: "error",
        category: "core-web-vitals",
        message: `LCP is ${Math.round(this.metrics.lcp)}ms (target: <2500ms)`,
        impact: "high",
        fix: "Optimize hero images, reduce server response time, minimize render-blocking resources",
      })
    }

    if (this.metrics.fid && this.metrics.fid > 100) {
      issues.push({
        type: "error",
        category: "core-web-vitals",
        message: `FID is ${Math.round(this.metrics.fid)}ms (target: <100ms)`,
        impact: "high",
        fix: "Reduce JavaScript execution time, break up long tasks, use code splitting",
      })
    }

    if (this.metrics.cls && this.metrics.cls > 0.1) {
      issues.push({
        type: "error",
        category: "core-web-vitals",
        message: `CLS is ${this.metrics.cls.toFixed(3)} (target: <0.1)`,
        impact: "high",
        fix: "Set width and height on images, reserve space for ads/embeds, avoid inserting content above existing content",
      })
    }

    // Image performance checks
    const largeImages = this.metrics.imageLoadTimes.filter((img) => img.size > 200000)
    if (largeImages.length > 0) {
      issues.push({
        type: "warning",
        category: "images",
        message: `${largeImages.length} images are larger than 200KB`,
        impact: "medium",
        fix: "Compress images, use WebP/AVIF format, implement responsive images with srcset",
      })
    }

    const slowImages = this.metrics.imageLoadTimes.filter((img) => img.loadTime > 1000)
    if (slowImages.length > 0) {
      issues.push({
        type: "warning",
        category: "images",
        message: `${slowImages.length} images took longer than 1s to load`,
        impact: "medium",
        fix: "Enable lazy loading, use image CDN, optimize image sizes",
      })
    }

    // Network performance checks
    if (this.metrics.slowRequests.length > 5) {
      issues.push({
        type: "warning",
        category: "network",
        message: `${this.metrics.slowRequests.length} requests took longer than 1s`,
        impact: "medium",
        fix: "Enable HTTP/2, use CDN, implement request prioritization, reduce payload sizes",
      })
    }

    if (this.metrics.totalBytes > 5000000) {
      issues.push({
        type: "warning",
        category: "network",
        message: `Total page size is ${(this.metrics.totalBytes / 1000000).toFixed(2)}MB`,
        impact: "medium",
        fix: "Enable compression, remove unused code, use code splitting, optimize assets",
      })
    }

    // Script performance checks
    const largeScripts = this.metrics.scriptLoadTimes.filter((script) => script.size > 500000)
    if (largeScripts.length > 0) {
      issues.push({
        type: "warning",
        category: "scripts",
        message: `${largeScripts.length} scripts are larger than 500KB`,
        impact: "medium",
        fix: "Use code splitting, remove unused code, minify and compress JavaScript",
      })
    }

    return issues
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations: string[] = []
    const highImpactIssues = issues.filter((issue) => issue.impact === "high")

    if (highImpactIssues.length > 0) {
      recommendations.push("🚨 Address high-impact performance issues first")
    }

    const imageIssues = issues.filter((issue) => issue.category === "images")
    if (imageIssues.length > 0) {
      recommendations.push("🖼️ Optimize images: Use OptimizedImage component, enable lazy loading, compress images")
    }

    const networkIssues = issues.filter((issue) => issue.category === "network")
    if (networkIssues.length > 0) {
      recommendations.push("🌐 Optimize network: Enable compression, use CDN, implement HTTP/2")
    }

    if (this.metrics.totalRequests > 50) {
      recommendations.push("📦 Reduce number of requests: Combine resources, use sprites, implement HTTP/2 server push")
    }

    return recommendations
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    const report = this.collect()
    return JSON.stringify(report, null, 2)
  }

  /**
   * Log performance report to console
   */
  logReport() {
    const report = this.collect()
    console.group("🚀 Performance Report")
    console.log("Metrics:", report.metrics)
    console.log("Issues:", report.issues)
    console.log("Recommendations:", report.recommendations)
    console.groupEnd()
  }
}

// Singleton instance
let analyzerInstance: PerformanceAnalyzer | null = null

/**
 * Get or create performance analyzer instance
 */
export function getPerformanceAnalyzer(): PerformanceAnalyzer {
  if (typeof window === "undefined") {
    throw new Error("PerformanceAnalyzer can only be used in browser environment")
  }

  if (!analyzerInstance) {
    analyzerInstance = new PerformanceAnalyzer()
  }

  return analyzerInstance
}

/**
 * Initialize performance monitoring (call this in your app)
 */
export function initPerformanceMonitoring() {
  if (typeof window === "undefined") {
    return
  }

  const analyzer = getPerformanceAnalyzer()
  analyzer.init()

  // Log report after page load
  if (document.readyState === "complete") {
    setTimeout(() => analyzer.logReport(), 2000)
  } else {
    window.addEventListener("load", () => {
      setTimeout(() => analyzer.logReport(), 2000)
    })
  }

  // Make analyzer available globally for debugging
  if (process.env.NODE_ENV === "development") {
    (window as any).__performanceAnalyzer = analyzer
  }
}

export default PerformanceAnalyzer


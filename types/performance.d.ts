// Performance monitoring types
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      parameters: {
        value?: number
        event_category?: string
        metric_name?: string
      }
    ) => void
  }
}

// Core Web Vitals types
export interface CoreWebVitals {
  lcp: number
  fid: number
  cls: number
  fcp: number
  tti: number
}

// Performance metrics types
export interface PerformanceMetrics {
  dns: number
  tcp: number
  ttfb: number
  domContentLoaded: number
  loadComplete: number
}

// Image preloading types
export interface ImagePreloadOptions {
  priority: "high" | "low"
  lazy: boolean
  threshold?: number
  rootMargin?: string
}

// Service worker types
export interface ServiceWorkerRegistration {
  installing: ServiceWorker | null
  waiting: ServiceWorker | null
  active: ServiceWorker | null
  scope: string
  updateViaCache: "all" | "imports" | "none"
  onupdatefound: ((this: ServiceWorkerRegistration, ev: Event) => any) | null
  oncontrollerchange: ((this: ServiceWorkerRegistration, ev: Event) => any) | null
}

// Performance observer types
export interface PerformanceObserverEntryList {
  getEntries(): PerformanceEntry[]
  getEntriesByType(type: string): PerformanceEntry[]
  getEntriesByName(name: string, type?: string): PerformanceEntry[]
}

export interface PerformanceObserver {
  observe(options: PerformanceObserverInit): void
  disconnect(): void
  takeRecords(): PerformanceEntry[]
}

export interface PerformanceObserverInit {
  entryTypes: string[]
  buffered?: boolean
}

// Navigation timing types
export interface PerformanceNavigationTiming extends PerformanceEntry {
  readonly domContentLoadedEventEnd: number
  readonly domContentLoadedEventStart: number
  readonly domComplete: number
  readonly domInteractive: number
  readonly loadEventEnd: number
  readonly loadEventStart: number
  readonly navigationStart: number
  readonly redirectCount: number
  readonly requestStart: number
  readonly responseEnd: number
  readonly responseStart: number
  readonly unloadEventEnd: number
  readonly unloadEventStart: number
  readonly domainLookupStart: number
  readonly domainLookupEnd: number
  readonly connectStart: number
  readonly connectEnd: number
  readonly secureConnectionStart: number
  readonly fetchStart: number
  readonly redirectStart: number
  readonly redirectEnd: number
  readonly responseStart: number
  readonly responseEnd: number
  readonly domLoading: number
  readonly domContentLoadedEventStart: number
  readonly domContentLoadedEventEnd: number
  readonly domComplete: number
  readonly loadEventStart: number
  readonly loadEventEnd: number
}

// Largest contentful paint types
export interface LargestContentfulPaint extends PerformanceEntry {
  readonly element?: Element
  readonly id?: string
  readonly url?: string
  readonly size: number
  readonly startTime: number
  readonly renderTime: number
  readonly loadTime: number
}

// First input delay types
export interface FirstInputDelay extends PerformanceEntry {
  readonly processingStart: number
  readonly processingEnd: number
  readonly target?: EventTarget
  readonly interactionId?: number
}

// Layout shift types
export interface LayoutShift extends PerformanceEntry {
  readonly value: number
  readonly hadRecentInput: boolean
  readonly lastInputTime: number
  readonly sources?: LayoutShiftAttribution[]
}

export interface LayoutShiftAttribution {
  readonly currentRect: DOMRectReadOnly
  readonly previousRect: DOMRectReadOnly
  readonly node?: Node
}

// First contentful paint types
export interface FirstContentfulPaint extends PerformanceEntry {
  readonly startTime: number
}

// Time to interactive types
export interface TimeToInteractive extends PerformanceEntry {
  readonly startTime: number
}

export {}

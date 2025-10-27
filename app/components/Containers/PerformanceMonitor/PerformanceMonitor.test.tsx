import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import PerformanceMonitor from './PerformanceMonitor'

describe('PerformanceMonitor (Container)', () => {
  let mockPerformanceObserver: any
  let performanceObserverInstances: any[] = []
  let mockGtag: any

  beforeEach(() => {
    vi.clearAllMocks()
    performanceObserverInstances = []
    mockGtag = vi.fn()

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})

    // Mock PerformanceObserver
    mockPerformanceObserver = vi.fn((callback: any) => {
      const instance = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        callback
      }
      performanceObserverInstances.push(instance)
      return instance
    })

    global.PerformanceObserver = mockPerformanceObserver as any

    // Mock window.gtag
    ;(global.window as any).gtag = mockGtag

    // Mock performance API
    global.performance = {
      ...global.performance,
      getEntriesByType: vi.fn((type: string) => {
        if (type === 'navigation') {
          return [
            {
              domainLookupStart: 0,
              domainLookupEnd: 10,
              connectStart: 10,
              connectEnd: 50,
              requestStart: 50,
              responseStart: 200,
              navigationStart: 0,
              domContentLoadedEventEnd: 1500,
              loadEventEnd: 2500
            }
          ]
        }
        return []
      })
    } as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (global.window as any).gtag
  })

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<PerformanceMonitor />)
      expect(container.firstChild).toBeNull()
    })

    it('should return null (no visual output)', () => {
      const { container } = render(<PerformanceMonitor />)
      expect(container.innerHTML).toBe('')
    })
  })

  describe('Development Mode Behavior', () => {
    it('should not set up observers in development mode', () => {
      // Mock development environment
      vi.stubEnv('DEV', true)

      render(<PerformanceMonitor />)

      expect(mockPerformanceObserver).not.toHaveBeenCalled()

      vi.unstubAllEnvs()
    })

    it('should set up observers in production mode', () => {
      // Mock production environment
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      // Should create observers for LCP, FID, CLS, FCP, TTI
      expect(performanceObserverInstances.length).toBeGreaterThanOrEqual(5)

      vi.unstubAllEnvs()
    })
  })

  describe('Core Web Vitals - LCP (Largest Contentful Paint)', () => {
    it('should observe LCP metric', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const lcpObserver = performanceObserverInstances[0]
      expect(lcpObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['largest-contentful-paint']
      })

      vi.unstubAllEnvs()
    })

    it('should log LCP value to console', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const lcpObserver = performanceObserverInstances[0]
      const mockEntries = [{ startTime: 2300 }]

      // Simulate LCP entry
      lcpObserver.callback({
        getEntries: () => mockEntries
      })

      expect(console.log).toHaveBeenCalledWith('LCP:', 2300)

      vi.unstubAllEnvs()
    })

    it('should send LCP to analytics', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const lcpObserver = performanceObserverInstances[0]
      const mockEntries = [{ startTime: 2300 }]

      lcpObserver.callback({
        getEntries: () => mockEntries
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'LCP', {
        value: 2300,
        event_category: 'Web Vitals'
      })

      vi.unstubAllEnvs()
    })

    it('should handle empty LCP entries', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const lcpObserver = performanceObserverInstances[0]

      lcpObserver.callback({
        getEntries: () => []
      })

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('LCP:'),
        expect.anything()
      )

      vi.unstubAllEnvs()
    })
  })

  describe('Core Web Vitals - FID (First Input Delay)', () => {
    it('should observe FID metric', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const fidObserver = performanceObserverInstances[1]
      expect(fidObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['first-input']
      })

      vi.unstubAllEnvs()
    })

    it('should log FID value to console', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const fidObserver = performanceObserverInstances[1]
      const mockEntries = [
        {
          startTime: 1000,
          processingStart: 1050
        }
      ]

      fidObserver.callback({
        getEntries: () => mockEntries
      })

      expect(console.log).toHaveBeenCalledWith('FID:', 50)

      vi.unstubAllEnvs()
    })

    it('should send FID to analytics', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const fidObserver = performanceObserverInstances[1]
      const mockEntries = [
        {
          startTime: 1000,
          processingStart: 1080
        }
      ]

      fidObserver.callback({
        getEntries: () => mockEntries
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'FID', {
        value: 80,
        event_category: 'Web Vitals'
      })

      vi.unstubAllEnvs()
    })
  })

  describe('Core Web Vitals - CLS (Cumulative Layout Shift)', () => {
    it('should observe CLS metric', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const clsObserver = performanceObserverInstances[2]
      expect(clsObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['layout-shift']
      })

      vi.unstubAllEnvs()
    })

    it('should accumulate CLS values', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const clsObserver = performanceObserverInstances[2]

      // First layout shift
      clsObserver.callback({
        getEntries: () => [{ value: 0.05, hadRecentInput: false }]
      })

      expect(console.log).toHaveBeenCalledWith('CLS:', 0.05)

      // Second layout shift
      clsObserver.callback({
        getEntries: () => [{ value: 0.03, hadRecentInput: false }]
      })

      expect(console.log).toHaveBeenCalledWith('CLS:', 0.08)

      vi.unstubAllEnvs()
    })

    it('should ignore layout shifts with recent input', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const clsObserver = performanceObserverInstances[2]

      clsObserver.callback({
        getEntries: () => [{ value: 0.05, hadRecentInput: true }]
      })

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('CLS:'),
        expect.anything()
      )

      vi.unstubAllEnvs()
    })

    it('should send CLS to analytics', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const clsObserver = performanceObserverInstances[2]

      clsObserver.callback({
        getEntries: () => [{ value: 0.123456, hadRecentInput: false }]
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'CLS', {
        value: 0.123,
        event_category: 'Web Vitals'
      })

      vi.unstubAllEnvs()
    })
  })

  describe('Core Web Vitals - FCP (First Contentful Paint)', () => {
    it('should observe FCP metric', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const fcpObserver = performanceObserverInstances[3]
      expect(fcpObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['first-contentful-paint']
      })

      vi.unstubAllEnvs()
    })

    it('should log FCP value to console', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const fcpObserver = performanceObserverInstances[3]
      const mockEntries = [{ startTime: 1200 }]

      fcpObserver.callback({
        getEntries: () => mockEntries
      })

      expect(console.log).toHaveBeenCalledWith('FCP:', 1200)

      vi.unstubAllEnvs()
    })

    it('should send FCP to analytics', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const fcpObserver = performanceObserverInstances[3]
      const mockEntries = [{ startTime: 1234 }]

      fcpObserver.callback({
        getEntries: () => mockEntries
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'FCP', {
        value: 1234,
        event_category: 'Web Vitals'
      })

      vi.unstubAllEnvs()
    })
  })

  describe('Core Web Vitals - TTI (Time to Interactive)', () => {
    it('should observe TTI using longtask', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const ttiObserver = performanceObserverInstances[4]
      expect(ttiObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['longtask']
      })

      vi.unstubAllEnvs()
    })

    it('should log TTI value to console', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const ttiObserver = performanceObserverInstances[4]
      const mockEntries = [{ startTime: 3500 }]

      ttiObserver.callback({
        getEntries: () => mockEntries
      })

      expect(console.log).toHaveBeenCalledWith('TTI:', 3500)

      vi.unstubAllEnvs()
    })

    it('should send TTI to analytics', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const ttiObserver = performanceObserverInstances[4]
      const mockEntries = [{ startTime: 3800 }]

      ttiObserver.callback({
        getEntries: () => mockEntries
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'TTI', {
        value: 3800,
        event_category: 'Web Vitals'
      })

      vi.unstubAllEnvs()
    })
  })

  describe('Navigation Performance Metrics', () => {
    it('should collect navigation metrics on page load', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      // Trigger load event
      window.dispatchEvent(new Event('load'))

      // Advance timers to trigger setTimeout
      vi.runAllTimers()

      expect(performance.getEntriesByType).toHaveBeenCalledWith('navigation')

      vi.unstubAllEnvs()
    })

    it('should log performance metrics', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      window.dispatchEvent(new Event('load'))
      vi.runAllTimers()

      expect(console.log).toHaveBeenCalledWith(
        'Performance Metrics:',
        expect.objectContaining({
          dns: expect.any(Number),
          tcp: expect.any(Number),
          ttfb: expect.any(Number),
          domContentLoaded: expect.any(Number),
          loadComplete: expect.any(Number)
        })
      )

      vi.unstubAllEnvs()
    })

    it('should send navigation metrics to analytics', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      window.dispatchEvent(new Event('load'))
      vi.runAllTimers()

      expect(mockGtag).toHaveBeenCalledWith('event', 'performance', {
        metric_name: 'dns',
        value: expect.any(Number),
        event_category: 'Performance'
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'performance', {
        metric_name: 'tcp',
        value: expect.any(Number),
        event_category: 'Performance'
      })

      vi.unstubAllEnvs()
    })
  })

  describe('Analytics Integration', () => {
    it('should work without gtag', () => {
      vi.stubEnv('DEV', false)
      delete (global.window as any).gtag

      render(<PerformanceMonitor />)

      const lcpObserver = performanceObserverInstances[0]
      const mockEntries = [{ startTime: 2300 }]

      // Should not throw error
      expect(() => {
        lcpObserver.callback({
          getEntries: () => mockEntries
        })
      }).not.toThrow()

      vi.unstubAllEnvs()
    })

    it('should round metric values before sending', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const lcpObserver = performanceObserverInstances[0]
      const mockEntries = [{ startTime: 2345.6789 }]

      lcpObserver.callback({
        getEntries: () => mockEntries
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'LCP', {
        value: 2346,
        event_category: 'Web Vitals'
      })

      vi.unstubAllEnvs()
    })
  })

  describe('Cleanup', () => {
    it('should disconnect all observers on unmount', () => {
      vi.stubEnv('DEV', false)

      const { unmount } = render(<PerformanceMonitor />)

      unmount()

      performanceObserverInstances.forEach(instance => {
        expect(instance.disconnect).toHaveBeenCalled()
      })

      vi.unstubAllEnvs()
    })
  })

  describe('Browser Compatibility', () => {
    it('should handle missing PerformanceObserver', () => {
      vi.stubEnv('DEV', false)
      delete (global as any).PerformanceObserver

      expect(() => {
        render(<PerformanceMonitor />)
      }).not.toThrow()

      vi.unstubAllEnvs()
    })

    it('should handle missing performance API', () => {
      vi.stubEnv('DEV', false)
      const originalPerformance = global.performance
      delete (global as any).performance

      expect(() => {
        render(<PerformanceMonitor />)
        window.dispatchEvent(new Event('load'))
      }).not.toThrow()

      global.performance = originalPerformance

      vi.unstubAllEnvs()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple entries in observer callback', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const fidObserver = performanceObserverInstances[1]
      const mockEntries = [
        { startTime: 1000, processingStart: 1050 },
        { startTime: 2000, processingStart: 2030 }
      ]

      fidObserver.callback({
        getEntries: () => mockEntries
      })

      expect(console.log).toHaveBeenCalledWith('FID:', 50)
      expect(console.log).toHaveBeenCalledWith('FID:', 30)

      vi.unstubAllEnvs()
    })

    it('should handle zero values', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const lcpObserver = performanceObserverInstances[0]
      const mockEntries = [{ startTime: 0 }]

      lcpObserver.callback({
        getEntries: () => mockEntries
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'LCP', {
        value: 0,
        event_category: 'Web Vitals'
      })

      vi.unstubAllEnvs()
    })

    it('should handle negative timing values', () => {
      vi.stubEnv('DEV', false)

      render(<PerformanceMonitor />)

      const fidObserver = performanceObserverInstances[1]
      const mockEntries = [
        {
          startTime: 1000,
          processingStart: 990 // Earlier than startTime
        }
      ]

      fidObserver.callback({
        getEntries: () => mockEntries
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'FID', {
        value: -10,
        event_category: 'Web Vitals'
      })

      vi.unstubAllEnvs()
    })
  })
})


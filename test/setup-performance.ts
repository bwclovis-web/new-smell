import { vi } from 'vitest'

// Performance test specific setup
export const performanceTestSetup = () => {
  // Mock performance API
  const mockPerformance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }

  Object.defineProperty(window, 'performance', {
    value: mockPerformance,
    writable: true
  })

  // Mock requestIdleCallback
  global.requestIdleCallback = vi.fn(callback => setTimeout(callback, 0))

  global.cancelIdleCallback = vi.fn(id => {
    clearTimeout(id)
  })

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn(callback => setTimeout(callback, 16) // ~60fps
  )

  global.cancelAnimationFrame = vi.fn(id => {
    clearTimeout(id)
  })

  // Mock IntersectionObserver for performance
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock ResizeObserver for performance
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Performance measurement utilities
  global.measurePerformance = (name: string, fn: () => void) => {
    const start = performance.now()
    fn()
    const end = performance.now()
    const duration = end - start

    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
    return duration
  }

  // Memory measurement utilities
  global.measureMemory = () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }
}

// Performance test cleanup
export const performanceTestCleanup = () => {
  // Clear any performance marks
  if (window.performance && window.performance.clearMarks) {
    window.performance.clearMarks()
  }
  if (window.performance && window.performance.clearMeasures) {
    window.performance.clearMeasures()
  }
}

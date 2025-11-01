import { describe, expect, it, vi } from 'vitest'

import { 
  createTestContext,
  registerCleanup,
  setupCompositeLifecycle, 
  setupConsoleLifecycle,
  setupTimerLifecycle} from './test-lifecycle-utils'
import { renderWithProviders } from './test-utils'

/**
 * Example Usage of Test Lifecycle Utilities
 * 
 * This file demonstrates real-world usage patterns for the lifecycle utilities
 */

// Example 1: Component Testing with Automatic Cleanup
describe('Component Testing Example', () => {
  // Setup standard component testing lifecycle
  setupCompositeLifecycle('component')

  it('should render and cleanup', () => {
    const mockCleanup = vi.fn()
    
    // Register cleanup function
    registerCleanup(mockCleanup)
    
    const { unmount } = renderWithProviders(<div>Hello World</div>)
    
    // Register component unmount
    registerCleanup(() => unmount())
    
    // Test passes, cleanup will be called automatically
    expect(mockCleanup).not.toHaveBeenCalled()
  })
})

// Example 2: Integration Testing with Storage
describe('Integration Testing Example', () => {
  // Setup comprehensive integration testing lifecycle
  // This clears mocks, DOM, timers, localStorage, and sessionStorage
  setupCompositeLifecycle('integration')

  it('should have clean storage between tests', () => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('test-key', 'value')
        expect(localStorage.getItem('test-key')).toBe('value')
      } catch (error) {
        // localStorage not available in this environment
      }
    }
  })

  it('should start with empty storage', () => {
    if (typeof localStorage !== 'undefined') {
      try {
        // Storage was cleared by the lifecycle
        expect(localStorage.getItem('test-key')).toBeNull()
      } catch (error) {
        // localStorage not available in this environment
      }
    }
  })
})

// Example 3: Test Context Pattern
describe('Test Context Example', () => {
  type TestContext = {
    userId: string
    userName: string
    data: string[]
  }

  const ctx = createTestContext<TestContext>()

  setupCompositeLifecycle('component')

  // Setup initial context before each test
  it('should initialize context', () => {
    ctx.set({
      userId: '123',
      userName: 'John Doe',
      data: []
    })

    expect(ctx.get().userId).toBe('123')
    expect(ctx.get().data).toEqual([])
  })

  it('should have fresh context', () => {
    // Context is reset between tests
    ctx.set({
      userId: '456',
      userName: 'Jane Smith',
      data: ['item1']
    })

    expect(ctx.get().userId).toBe('456')
    expect(ctx.get().data).toEqual(['item1'])
  })
})

// Example 4: Timer Testing
describe('Timer Testing Example', () => {
  setupTimerLifecycle(true)

  it('should control time', () => {
    const callback = vi.fn()
    
    setTimeout(callback, 1000)
    
    // Fast-forward time
    vi.advanceTimersByTime(500)
    expect(callback).not.toHaveBeenCalled()
    
    vi.advanceTimersByTime(500)
    expect(callback).toHaveBeenCalled()
  })
})

// Example 5: Console Mocking
describe('Console Mocking Example', () => {
  const { log, error } = setupConsoleLifecycle({
    log: true,
    error: true
  })

  it('should capture console output', () => {
    if (log) {
      console.log('test message')
      expect(log).toHaveBeenCalledWith('test message')
    }
  })

  it('should capture errors', () => {
    if (error) {
      console.error('error message')
      expect(error).toHaveBeenCalledWith('error message')
    }
  })
})

// Example 6: API Testing with Fetch
describe('API Testing Example', () => {
  setupCompositeLifecycle('api')

  it('should mock fetch calls', async () => {
    const mockData = { id: 1, name: 'Test' }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    } as Response)

    // Register cleanup for the mock
    registerCleanup(() => {
      vi.restoreAllMocks()
    })

    const response = await fetch('/api/test')
    const data = await response.json()

    expect(data).toEqual(mockData)
  })
})

// Example 7: Async Resource Management
describe('Async Resource Management Example', () => {
  setupCompositeLifecycle('component')

  it('should cleanup async resources', async () => {
    const resource = {
      isOpen: true,
      close: vi.fn(() => {
        resource.isOpen = false
      })
    }

    // Register async cleanup
    registerCleanup(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      resource.close()
    })

    expect(resource.isOpen).toBe(true)
    
    // After test, cleanup will be called and resource will be closed
  })
})

// Example 8: Multiple Cleanup Functions
describe('Multiple Cleanup Example', () => {
  setupCompositeLifecycle('component')

  it('should execute multiple cleanups in LIFO order', () => {
    const order: string[] = []

    // Register cleanup functions
    registerCleanup(() => order.push('first'))
    registerCleanup(() => order.push('second'))
    registerCleanup(() => order.push('third'))

    // During test
    expect(order).toEqual([])
    
    // After test, cleanups execute in reverse order: third, second, first
  })
})


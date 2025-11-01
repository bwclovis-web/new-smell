import { afterEach, beforeEach, vi } from "vitest"

/**
 * Test Lifecycle Utilities
 *
 * Utilities for managing test setup and cleanup with beforeEach/afterEach
 * Provides standardized patterns for test initialization and teardown
 */

// Cleanup callback registry
type CleanupFn = () => void | Promise<void>
const cleanupRegistry: CleanupFn[] = []

/**
 * Register a cleanup function to be executed after each test
 * @param cleanupFn - Function to execute during cleanup
 */
export const registerCleanup = (cleanupFn: CleanupFn): void => {
  cleanupRegistry.push(cleanupFn)
}

/**
 * Execute all registered cleanup functions
 */
export const executeCleanup = async (): Promise<void> => {
  // Execute in reverse order (LIFO)
  while (cleanupRegistry.length > 0) {
    const cleanup = cleanupRegistry.pop()
    if (cleanup) {
      await cleanup()
    }
  }
}

/**
 * Clear all registered cleanup functions
 */
export const clearCleanupRegistry = (): void => {
  cleanupRegistry.length = 0
}

/**
 * Standard beforeEach setup for common test scenarios
 */
export const standardBeforeEach = (options: {
    clearMocks?: boolean
    resetDOM?: boolean
    clearTimers?: boolean
    clearLocalStorage?: boolean
    clearSessionStorage?: boolean
  } = {}) => {
  const {
    clearMocks = true,
    resetDOM = false,
    clearTimers = false,
    clearLocalStorage = false,
    clearSessionStorage = false,
  } = options

  beforeEach(() => {
    // Clear all mocks
    if (clearMocks) {
      vi.clearAllMocks()
    }

    // Reset DOM if requested
    if (resetDOM && typeof document !== "undefined") {
      document.body.innerHTML = ""
    }

    // Clear timers
    if (clearTimers) {
      vi.clearAllTimers()
    }

    // Clear storage
    if (clearLocalStorage && typeof localStorage !== "undefined") {
      localStorage.clear()
    }

    if (clearSessionStorage && typeof sessionStorage !== "undefined") {
      sessionStorage.clear()
    }
  })
}

/**
 * Standard afterEach cleanup for common test scenarios
 */
export const standardAfterEach = (options: {
    restoreMocks?: boolean
    restoreTimers?: boolean
    executeRegisteredCleanup?: boolean
  } = {}) => {
  const {
    restoreMocks = true,
    restoreTimers = true,
    executeRegisteredCleanup = true,
  } = options

  afterEach(async () => {
    // Execute registered cleanup functions
    if (executeRegisteredCleanup) {
      await executeCleanup()
    }

    // Restore all mocks
    if (restoreMocks) {
      vi.restoreAllMocks()
    }

    // Restore real timers
    if (restoreTimers && vi.isFakeTimers()) {
      vi.useRealTimers()
    }

    // Clear cleanup registry
    clearCleanupRegistry()
  })
}

/**
 * Setup full test lifecycle with both beforeEach and afterEach
 */
export const setupTestLifecycle = (options?: {
  beforeEach?: Parameters<typeof standardBeforeEach>[0]
  afterEach?: Parameters<typeof standardAfterEach>[0]
}) => {
  standardBeforeEach(options?.beforeEach)
  standardAfterEach(options?.afterEach)
}

/**
 * Lifecycle utility for API mocking
 */
export const setupApiMockLifecycle = () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch

    // Clear any existing mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original fetch
    if (originalFetch) {
      global.fetch = originalFetch
    }
  })

  return {
    getOriginalFetch: () => originalFetch,
  }
}

/**
 * Lifecycle utility for timer testing
 */
export const setupTimerLifecycle = (useFakeTimers = true) => {
  beforeEach(() => {
    if (useFakeTimers) {
      vi.useFakeTimers()
    }
  })

  afterEach(() => {
    if (useFakeTimers) {
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
}

/**
 * Lifecycle utility for localStorage testing
 */
export const setupStorageLifecycle = (options: {
    localStorage?: boolean
    sessionStorage?: boolean
  } = {}) => {
  const {
    localStorage: useLocalStorage = true,
    sessionStorage: useSessionStorage = true,
  } = options

  const storage: {
    local: Record<string, string>
    session: Record<string, string>
  } = {
    local: {},
    session: {},
  }

  beforeEach(() => {
    if (useLocalStorage && typeof localStorage !== "undefined") {
      localStorage.clear()
      storage.local = {}
    }

    if (useSessionStorage && typeof sessionStorage !== "undefined") {
      sessionStorage.clear()
      storage.session = {}
    }
  })

  afterEach(() => {
    if (useLocalStorage && typeof localStorage !== "undefined") {
      localStorage.clear()
    }

    if (useSessionStorage && typeof sessionStorage !== "undefined") {
      sessionStorage.clear()
    }
  })

  return storage
}

/**
 * Lifecycle utility for DOM testing
 */
export const setupDOMLifecycle = () => {
  let originalBodyInnerHTML: string

  beforeEach(() => {
    if (typeof document !== "undefined") {
      originalBodyInnerHTML = document.body.innerHTML
    }
  })

  afterEach(() => {
    if (typeof document !== "undefined") {
      document.body.innerHTML = originalBodyInnerHTML || ""
    }
  })
}

/**
 * Lifecycle utility for event listener testing
 */
export const setupEventListenerLifecycle = () => {
  type Listener = () => void
  type ListenerOptions =
    | boolean
    | { capture?: boolean; once?: boolean; passive?: boolean }

  const listeners: Array<{
    target: EventTarget
    type: string
    listener: Listener
    options?: ListenerOptions
  }> = []

  const addEventListenerSpy = vi.fn((
      target: EventTarget,
      type: string,
      listener: Listener,
      options?: ListenerOptions
    ) => {
      listeners.push({ target, type, listener, options })
      target.addEventListener(
        type,
        listener as Parameters<typeof target.addEventListener>[1],
        options as Parameters<typeof target.addEventListener>[2]
      )
    })

  afterEach(() => {
    // Remove all tracked event listeners
    listeners.forEach(({ target, type, listener, options }) => {
      target.removeEventListener(
        type,
        listener as Parameters<typeof target.removeEventListener>[1],
        options as Parameters<typeof target.removeEventListener>[2]
      )
    })
    listeners.length = 0
    addEventListenerSpy.mockClear()
  })

  return {
    trackListener: addEventListenerSpy,
    getListeners: () => [...listeners],
  }
}

/**
 * Lifecycle utility for async operations
 */
export const setupAsyncLifecycle = () => {
  const pendingPromises: Promise<any>[] = []
  const abortControllers: AbortController[] = []

  const trackPromise = <T>(promise: Promise<T>): Promise<T> => {
    pendingPromises.push(promise)
    return promise.finally(() => {
      const index = pendingPromises.indexOf(promise)
      if (index > -1) {
        pendingPromises.splice(index, 1)
      }
    })
  }

  const createAbortController = (): AbortController => {
    const controller = new AbortController()
    abortControllers.push(controller)
    return controller
  }

  afterEach(async () => {
    // Abort all controllers
    abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
    abortControllers.length = 0

    // Wait for all pending promises (with timeout)
    const timeout = new Promise(resolve => setTimeout(resolve, 100))
    await Promise.race([Promise.allSettled(pendingPromises), timeout])
    pendingPromises.length = 0
  })

  return {
    trackPromise,
    createAbortController,
    getPendingPromises: () => [...pendingPromises],
    getAbortControllers: () => [...abortControllers],
  }
}

/**
 * Lifecycle utility for console mocking
 */
export const setupConsoleLifecycle = (options: {
    log?: boolean
    warn?: boolean
    error?: boolean
    info?: boolean
  } = {}) => {
  const {
    log: mockLog = false,
    warn: mockWarn = false,
    error: mockError = false,
    info: mockInfo = false,
  } = options

  const mocks: {
    log?: ReturnType<typeof vi.spyOn>
    warn?: ReturnType<typeof vi.spyOn>
    error?: ReturnType<typeof vi.spyOn>
    info?: ReturnType<typeof vi.spyOn>
  } = {}

  beforeEach(() => {
    if (mockLog) {
      mocks.log = vi.spyOn(console, "log").mockImplementation(() => undefined)
    }
    if (mockWarn) {
      mocks.warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    }
    if (mockError) {
      mocks.error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    }
    if (mockInfo) {
      mocks.info = vi.spyOn(console, "info").mockImplementation(() => undefined)
    }
  })

  afterEach(() => {
    Object.values(mocks).forEach(mock => mock?.mockRestore())
  })

  return mocks
}

/**
 * Create a test context that persists across beforeEach/afterEach
 * Useful for sharing state between setup and tests
 */
export const createTestContext = <T extends Record<string, any>>() => {
  let context = {} as T

  beforeEach(() => {
    context = {} as T
  })

  const updateContext = (newValues: Partial<T>) => {
    context = Object.assign(context, newValues)
  }

  return {
    get: () => context,
    set: updateContext,
    reset: () => {
      context = {} as T
    },
  }
}

/**
 * Composite lifecycle setup for common testing scenarios
 */
export const setupCompositeLifecycle = (scenario: "component" | "integration" | "api" | "e2e") => {
  switch (scenario) {
    case "component":
      setupTestLifecycle({
        beforeEach: {
          clearMocks: true,
          resetDOM: false,
          clearTimers: false,
        },
        afterEach: {
          restoreMocks: true,
          restoreTimers: true,
          executeRegisteredCleanup: true,
        },
      })
      break

    case "integration":
      setupTestLifecycle({
        beforeEach: {
          clearMocks: true,
          resetDOM: true,
          clearTimers: true,
          clearLocalStorage: true,
          clearSessionStorage: true,
        },
        afterEach: {
          restoreMocks: true,
          restoreTimers: true,
          executeRegisteredCleanup: true,
        },
      })
      setupStorageLifecycle()
      break

    case "api":
      setupTestLifecycle({
        beforeEach: {
          clearMocks: true,
        },
        afterEach: {
          restoreMocks: true,
          executeRegisteredCleanup: true,
        },
      })
      setupApiMockLifecycle()
      break

    case "e2e":
      setupTestLifecycle({
        beforeEach: {
          clearMocks: false,
          clearTimers: false,
        },
        afterEach: {
          restoreMocks: false,
          restoreTimers: false,
          executeRegisteredCleanup: true,
        },
      })
      break

    default:
      // Should never reach here due to TypeScript type checking
      throw new Error(`Unknown scenario: ${scenario as string}`)
  }
}

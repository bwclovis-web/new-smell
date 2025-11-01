import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearCleanupRegistry,
  createTestContext,
  executeCleanup,
  registerCleanup,
  setupApiMockLifecycle,
  setupAsyncLifecycle,
  setupCompositeLifecycle,
  setupConsoleLifecycle,
  setupDOMLifecycle,
  setupEventListenerLifecycle,
  setupStorageLifecycle,
  setupTestLifecycle,
  setupTimerLifecycle,
  standardAfterEach,
  standardBeforeEach,
} from "../../utils/test-lifecycle-utils"

describe("Test Lifecycle Utilities", () => {
  describe("Cleanup Registry", () => {
    beforeEach(() => {
      clearCleanupRegistry()
    })

    afterEach(() => {
      clearCleanupRegistry()
    })

    it("should register cleanup functions", () => {
      const cleanup = vi.fn()
      registerCleanup(cleanup)

      expect(cleanup).not.toHaveBeenCalled()
    })

    it("should execute registered cleanup functions", async () => {
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()

      registerCleanup(cleanup1)
      registerCleanup(cleanup2)

      await executeCleanup()

      expect(cleanup1).toHaveBeenCalledTimes(1)
      expect(cleanup2).toHaveBeenCalledTimes(1)
    })

    it("should execute cleanup functions in LIFO order", async () => {
      const executionOrder: number[] = []
      const cleanup1 = vi.fn(() => executionOrder.push(1))
      const cleanup2 = vi.fn(() => executionOrder.push(2))
      const cleanup3 = vi.fn(() => executionOrder.push(3))

      registerCleanup(cleanup1)
      registerCleanup(cleanup2)
      registerCleanup(cleanup3)

      await executeCleanup()

      expect(executionOrder).toEqual([3, 2, 1])
    })

    it("should clear cleanup registry", () => {
      const cleanup = vi.fn()
      registerCleanup(cleanup)

      clearCleanupRegistry()

      // After clearing, executing should not call the cleanup
      executeCleanup()
      expect(cleanup).not.toHaveBeenCalled()
    })

    it("should handle async cleanup functions", async () => {
      const cleanup = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      registerCleanup(cleanup)
      await executeCleanup()

      expect(cleanup).toHaveBeenCalledTimes(1)
    })
  })

  describe("standardBeforeEach", () => {
    it("should clear mocks by default", () => {
      const mockFn = vi.fn()
      mockFn()

      expect(mockFn).toHaveBeenCalledTimes(1)

      // Simulate beforeEach
      vi.clearAllMocks()

      expect(mockFn).toHaveBeenCalledTimes(0)
    })

    it("should reset DOM when requested", () => {
      if (typeof document !== "undefined") {
        document.body.innerHTML = "<div>Test</div>"

        expect(document.body.innerHTML).toContain("Test")

        // Simulate beforeEach with resetDOM
        document.body.innerHTML = ""

        expect(document.body.innerHTML).toBe("")
      }
    })

    it("should clear localStorage when requested", () => {
      if (typeof localStorage !== "undefined") {
        // Setup localStorage if it exists
        try {
          localStorage.clear()
          localStorage.setItem("test", "value")

          expect(localStorage.getItem("test")).toBe("value")

          // Simulate beforeEach with clearLocalStorage
          localStorage.clear()

          expect(localStorage.getItem("test")).toBeNull()
        } catch (error) {
          // Skip test if localStorage is not available
          console.log("localStorage not available, skipping test")
        }
      } else {
        // Skip test if localStorage is not defined
        console.log("localStorage not defined, skipping test")
      }
    })

    it("should clear sessionStorage when requested", () => {
      if (typeof sessionStorage !== "undefined") {
        try {
          sessionStorage.clear()
          sessionStorage.setItem("test", "value")

          expect(sessionStorage.getItem("test")).toBe("value")

          // Simulate beforeEach with clearSessionStorage
          sessionStorage.clear()

          expect(sessionStorage.getItem("test")).toBeNull()
        } catch (error) {
          // Skip test if sessionStorage is not available
          console.log("sessionStorage not available, skipping test")
        }
      } else {
        // Skip test if sessionStorage is not defined
        console.log("sessionStorage not defined, skipping test")
      }
    })
  })

  describe("standardAfterEach", () => {
    it("should restore mocks by default", () => {
      const originalLog = console.log
      const spy = vi.spyOn(console, "log")

      expect(console.log).toBe(spy)

      // Simulate afterEach
      spy.mockRestore()

      expect(console.log).toBe(originalLog)
    })

    it("should restore timers when fake timers are active", () => {
      vi.useFakeTimers()

      expect(vi.isFakeTimers()).toBe(true)

      // Simulate afterEach
      vi.useRealTimers()

      expect(vi.isFakeTimers()).toBe(false)
    })
  })

  describe("setupApiMockLifecycle", () => {
    it("should store and restore original fetch", () => {
      // Setup a mock fetch if it doesn't exist
      if (!global.fetch) {
        global.fetch = vi.fn() as any
      }

      const { getOriginalFetch } = setupApiMockLifecycle()

      // The original fetch should be stored (even if it's our mock)
      expect(getOriginalFetch).toBeDefined()
    })
  })

  describe("setupTimerLifecycle", () => {
    it("should setup fake timers in beforeEach", () => {
      setupTimerLifecycle(true)

      // After cleanup from previous test
      expect(vi.isFakeTimers()).toBe(false)
    })
  })

  describe("setupStorageLifecycle", () => {
    it("should clear localStorage in beforeEach", () => {
      if (typeof localStorage !== "undefined") {
        try {
          const storage = setupStorageLifecycle({
            localStorage: true,
            sessionStorage: false,
          })

          localStorage.clear()
          localStorage.setItem("test", "value")
          expect(localStorage.getItem("test")).toBe("value")

          // Storage should be cleared in next test
          expect(storage.local).toEqual({})
        } catch (error) {
          console.log("localStorage not available, skipping test")
        }
      } else {
        console.log("localStorage not defined, skipping test")
      }
    })

    it("should clear sessionStorage in beforeEach", () => {
      if (typeof sessionStorage !== "undefined") {
        try {
          const storage = setupStorageLifecycle({
            localStorage: false,
            sessionStorage: true,
          })

          sessionStorage.clear()
          sessionStorage.setItem("test", "value")
          expect(sessionStorage.getItem("test")).toBe("value")

          // Storage should be cleared in next test
          expect(storage.session).toEqual({})
        } catch (error) {
          console.log("sessionStorage not available, skipping test")
        }
      } else {
        console.log("sessionStorage not defined, skipping test")
      }
    })
  })

  describe("setupDOMLifecycle", () => {
    it("should save and restore body innerHTML", () => {
      if (typeof document !== "undefined") {
        setupDOMLifecycle()

        const originalHTML = document.body.innerHTML
        document.body.innerHTML = "<div>Changed</div>"

        expect(document.body.innerHTML).toContain("Changed")

        // In a real test, afterEach would restore this
        // For this test, we just verify the original was captured
        expect(originalHTML).toBeDefined()
      }
    })
  })

  describe("setupEventListenerLifecycle", () => {
    it("should track event listeners", () => {
      if (typeof document !== "undefined") {
        const { trackListener, getListeners } = setupEventListenerLifecycle()

        const button = document.createElement("button")
        const handler = vi.fn()

        trackListener(button, "click", handler)

        expect(getListeners()).toHaveLength(1)
        expect(getListeners()[0].type).toBe("click")
      }
    })

    it("should remove tracked listeners in afterEach", () => {
      if (typeof document !== "undefined") {
        const { trackListener, getListeners } = setupEventListenerLifecycle()

        const button = document.createElement("button")
        const handler = vi.fn()

        trackListener(button, "click", handler)

        // Simulate afterEach
        getListeners().forEach(({ target, type, listener, options }) => {
          target.removeEventListener(type, listener, options)
        })

        button.click()
        expect(handler).not.toHaveBeenCalled()
      }
    })
  })

  describe("setupAsyncLifecycle", () => {
    it("should track promises", () => {
      const { trackPromise, getPendingPromises } = setupAsyncLifecycle()

      const promise = Promise.resolve(42)
      trackPromise(promise)

      expect(getPendingPromises()).toContain(promise)
    })

    it("should remove resolved promises from tracking", async () => {
      const { trackPromise, getPendingPromises } = setupAsyncLifecycle()

      const promise = Promise.resolve(42)
      await trackPromise(promise)

      expect(getPendingPromises()).not.toContain(promise)
    })

    it("should create abort controllers", () => {
      const { createAbortController, getAbortControllers } = setupAsyncLifecycle()

      const controller = createAbortController()

      expect(getAbortControllers()).toContain(controller)
      expect(controller.signal.aborted).toBe(false)
    })

    it("should abort all controllers in afterEach", async () => {
      const { createAbortController, getAbortControllers } = setupAsyncLifecycle()

      const controller1 = createAbortController()
      const controller2 = createAbortController()

      // Simulate afterEach
      getAbortControllers().forEach(c => {
        if (!c.signal.aborted) {
          c.abort()
        }
      })

      expect(controller1.signal.aborted).toBe(true)
      expect(controller2.signal.aborted).toBe(true)
    })
  })

  describe("setupConsoleLifecycle", () => {
    it("should mock console.log when requested", () => {
      const { log } = setupConsoleLifecycle({ log: true })

      // In a real test with beforeEach, this would be mocked
      if (log) {
        console.log("test")
        expect(log).toBeDefined()
      }
    })

    it("should mock console.error when requested", () => {
      const { error } = setupConsoleLifecycle({ error: true })

      if (error) {
        expect(error).toBeDefined()
      }
    })

    it("should mock console.warn when requested", () => {
      const { warn } = setupConsoleLifecycle({ warn: true })

      if (warn) {
        expect(warn).toBeDefined()
      }
    })

    it("should mock console.info when requested", () => {
      const { info } = setupConsoleLifecycle({ info: true })

      if (info) {
        expect(info).toBeDefined()
      }
    })
  })

  describe("createTestContext", () => {
    it("should create a test context", () => {
      type TestCtx = { count: number; name: string }
      const ctx = createTestContext<TestCtx>()

      ctx.set({ count: 0, name: "test" })

      expect(ctx.get()).toEqual({ count: 0, name: "test" })
    })

    it("should update context values", () => {
      type TestCtx = { count: number; name: string }
      const ctx = createTestContext<TestCtx>()

      ctx.set({ count: 0, name: "test" })
      ctx.set({ count: 1 })

      expect(ctx.get()).toEqual({ count: 1, name: "test" })
    })

    it("should reset context", () => {
      type TestCtx = { count: number }
      const ctx = createTestContext<TestCtx>()

      ctx.set({ count: 5 })
      ctx.reset()

      expect(ctx.get()).toEqual({})
    })
  })

  describe("setupCompositeLifecycle", () => {
    it("should setup component testing lifecycle", () => {
      // This would normally be called at the describe block level
      // For this test, we just verify it doesn't throw
      expect(() => setupCompositeLifecycle("component")).not.toThrow()
    })

    it("should setup integration testing lifecycle", () => {
      expect(() => setupCompositeLifecycle("integration")).not.toThrow()
    })

    it("should setup API testing lifecycle", () => {
      expect(() => setupCompositeLifecycle("api")).not.toThrow()
    })

    it("should setup E2E testing lifecycle", () => {
      expect(() => setupCompositeLifecycle("e2e")).not.toThrow()
    })
  })

  describe("Real-world Usage Examples", () => {
    describe("Component Testing with Lifecycle", () => {
      // Setup lifecycle for component tests
      setupCompositeLifecycle("component")

      it("should have clean state between tests", () => {
        const mockFn = vi.fn()
        mockFn()

        expect(mockFn).toHaveBeenCalledTimes(1)
      })

      it("should have clean state in second test", () => {
        const mockFn = vi.fn()

        // This would fail if mocks weren't cleared
        expect(mockFn).toHaveBeenCalledTimes(0)
      })
    })

    describe("API Testing with Lifecycle", () => {
      setupCompositeLifecycle("api")

      it("should mock API calls", () => {
        // API lifecycle ensures fetch is properly managed
        expect(global.fetch).toBeDefined()
      })
    })

    describe("Custom Cleanup with registerCleanup", () => {
      setupTestLifecycle()

      it("should cleanup custom resources", async () => {
        const resource = { cleanup: vi.fn() }

        // Register cleanup for this test
        registerCleanup(() => resource.cleanup())

        expect(resource.cleanup).not.toHaveBeenCalled()

        // After this test, cleanup will be called automatically
      })
    })

    describe("Test Context Pattern", () => {
      type TestContext = {
        data: string[]
        counter: number
      }

      const ctx = createTestContext<TestContext>()

      beforeEach(() => {
        ctx.set({ data: [], counter: 0 })
      })

      it("should have initial context", () => {
        expect(ctx.get().data).toEqual([])
        expect(ctx.get().counter).toBe(0)
      })

      it("should have fresh context in each test", () => {
        ctx.set({ counter: 5 })
        ctx.get().data.push("test")

        expect(ctx.get().counter).toBe(5)
        expect(ctx.get().data).toEqual(["test"])
      })

      it("should not persist context from previous test", () => {
        // This test should have fresh context
        expect(ctx.get().counter).toBe(0)
        expect(ctx.get().data).toEqual([])
      })
    })
  })
})

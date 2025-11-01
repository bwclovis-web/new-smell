/**
 * Tests for data-fetching utility functions
 *
 * @group unit
 * @group utils
 * @group data-fetching
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildQueryString,
  clearAllCache,
  createFetchFn,
  getCacheStats,
  parseApiResponse,
  retryFetch,
  withCache,
} from "~/utils/data-fetching"

describe("buildQueryString", () => {
  it("should build query string from params", () => {
    const result = buildQueryString("/api/test", {
      page: 1,
      limit: 20,
      search: "test",
    })

    expect(result).toBe("/api/test?page=1&limit=20&search=test")
  })

  it("should ignore undefined and null params", () => {
    const result = buildQueryString("/api/test", {
      page: 1,
      search: undefined,
      filter: null,
      empty: "",
    })

    expect(result).toBe("/api/test?page=1")
  })

  it("should return base URL if no params", () => {
    const result = buildQueryString("/api/test", {})
    expect(result).toBe("/api/test")
  })

  it("should handle boolean params", () => {
    const result = buildQueryString("/api/test", {
      active: true,
      deleted: false,
    })

    expect(result).toBe("/api/test?active=true&deleted=false")
  })

  it("should handle number params", () => {
    const result = buildQueryString("/api/test", {
      page: 1,
      limit: 20,
      offset: 0,
    })

    expect(result).toBe("/api/test?page=1&limit=20&offset=0")
  })
})

describe("withCache", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("should cache function result", async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: "test" })
    const cachedFn = withCache(mockFn, "test-key", 300000)

    const result1 = await cachedFn()
    expect(result1).toEqual({ data: "test" })
    expect(mockFn).toHaveBeenCalledTimes(1)

    // Second call should use cache
    const result2 = await cachedFn()
    expect(result2).toEqual({ data: "test" })
    expect(mockFn).toHaveBeenCalledTimes(1) // Still 1

    const cached = localStorage.getItem("data-fetch-test-key")
    expect(cached).toBeTruthy()
  })

  it("should refetch when cache is expired", async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: "test" })
    const cachedFn = withCache(mockFn, "test-key", 1000) // 1 second

    await cachedFn()
    expect(mockFn).toHaveBeenCalledTimes(1)

    // Manually expire cache
    const cached = JSON.parse(localStorage.getItem("data-fetch-test-key")!)
    cached.timestamp = Date.now() - 2000 // 2 seconds ago
    localStorage.setItem("data-fetch-test-key", JSON.stringify(cached))

    // Should refetch
    await cachedFn()
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it("should handle fetch errors", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("Fetch failed"))
    const cachedFn = withCache(mockFn, "test-key", 300000)

    await expect(cachedFn()).rejects.toThrow("Fetch failed")
  })
})

describe("parseApiResponse", () => {
  it("should parse successful API response", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 1, name: "Test" },
      }),
    } as Response

    const result = await parseApiResponse(Promise.resolve(mockResponse))
    expect(result).toEqual({ id: 1, name: "Test" })
  })

  it("should throw on HTTP error", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    } as Response

    await expect(parseApiResponse(Promise.resolve(mockResponse))).rejects.toThrow("HTTP error! status: 404")
  })

  it("should throw when success is false", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: false,
        error: "Something went wrong",
      }),
    } as Response

    await expect(parseApiResponse(Promise.resolve(mockResponse))).rejects.toThrow("Something went wrong")
  })

  it("should throw when data is missing", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        // No data field
      }),
    } as Response

    await expect(parseApiResponse(Promise.resolve(mockResponse))).rejects.toThrow("API response missing data field")
  })

  it("should use message field if error is missing", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: false,
        message: "Error message",
      }),
    } as Response

    await expect(parseApiResponse(Promise.resolve(mockResponse))).rejects.toThrow("Error message")
  })
})

describe("createFetchFn", () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it("should create fetch function with base URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 1 },
      }),
    })

    const apiFetch = createFetchFn({ baseUrl: "/api" })
    const result = await apiFetch("/users")

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    )

    expect(result).toEqual({ id: 1 })
  })

  it("should include custom headers", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {},
      }),
    })

    const apiFetch = createFetchFn({
      baseUrl: "/api",
      headers: { "X-Custom-Header": "value" },
    })

    await apiFetch("/users")

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Custom-Header": "value",
        }),
      })
    )
  })

  it("should set credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {},
      }),
    })

    const apiFetch = createFetchFn({
      credentials: "include",
    })

    await apiFetch("/users")

    expect(global.fetch).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({
        credentials: "include",
      })
    )
  })

  it("should merge request init options", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {},
      }),
    })

    const apiFetch = createFetchFn({ baseUrl: "/api" })
    await apiFetch("/users", {
      method: "POST",
      headers: { "X-Extra": "header" },
    })

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Extra": "header",
        }),
      })
    )
  })
})

describe("retryFetch", () => {
  it("should retry on failure", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValue({ data: "success" })

    const result = await retryFetch(mockFn, {
      maxAttempts: 3,
      initialDelay: 10,
    })

    expect(result).toEqual({ data: "success" })
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it("should throw after max attempts", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("Always fail"))

    await expect(retryFetch(mockFn, {
        maxAttempts: 3,
        initialDelay: 10,
      })).rejects.toThrow("Always fail")

    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it("should use exponential backoff", async () => {
    const delays: number[] = []
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValue({ data: "success" })

    const startTime = Date.now()
    let lastTime = startTime

    const wrappedFn = async () => {
      const now = Date.now()
      if (lastTime !== startTime) {
        delays.push(now - lastTime)
      }
      lastTime = now
      return mockFn()
    }

    await retryFetch(wrappedFn, {
      maxAttempts: 3,
      initialDelay: 100,
      backoffFactor: 2,
    })

    // First delay should be ~100ms, second should be ~200ms
    expect(delays[0]).toBeGreaterThanOrEqual(90)
    expect(delays[0]).toBeLessThan(150)
    expect(delays[1]).toBeGreaterThanOrEqual(180)
    expect(delays[1]).toBeLessThan(250)
  })

  it("should respect max delay", async () => {
    const delays: number[] = []
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockRejectedValueOnce(new Error("Fail 3"))
      .mockResolvedValue({ data: "success" })

    const startTime = Date.now()
    let lastTime = startTime

    const wrappedFn = async () => {
      const now = Date.now()
      if (lastTime !== startTime) {
        delays.push(now - lastTime)
      }
      lastTime = now
      return mockFn()
    }

    await retryFetch(wrappedFn, {
      maxAttempts: 4,
      initialDelay: 1000,
      backoffFactor: 10,
      maxDelay: 1500,
    })

    // All delays should be capped at maxDelay
    delays.forEach(delay => {
      expect(delay).toBeLessThanOrEqual(1600) // Allow some tolerance
    })
  })

  it("should succeed on first try", async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: "success" })

    const result = await retryFetch(mockFn, {
      maxAttempts: 3,
      initialDelay: 10,
    })

    expect(result).toEqual({ data: "success" })
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

describe("Cache Management", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe("clearAllCache", () => {
    it("should clear all cached data", () => {
      localStorage.setItem("data-fetch-test1", JSON.stringify({ data: 1 }))
      localStorage.setItem("data-fetch-test2", JSON.stringify({ data: 2 }))
      localStorage.setItem("other-key", "should-remain")

      clearAllCache()

      expect(localStorage.getItem("data-fetch-test1")).toBeNull()
      expect(localStorage.getItem("data-fetch-test2")).toBeNull()
      expect(localStorage.getItem("other-key")).toBe("should-remain")
    })
  })

  describe("getCacheStats", () => {
    it("should return cache statistics", () => {
      localStorage.setItem("data-fetch-test1", JSON.stringify({ data: "value1" }))
      localStorage.setItem("data-fetch-test2", JSON.stringify({ data: "value2" }))

      const stats = getCacheStats()

      expect(stats.count).toBe(2)
      expect(stats.keys).toContain("test1")
      expect(stats.keys).toContain("test2")
      expect(stats.totalSize).toBeGreaterThan(0)
    })

    it("should return empty stats when no cache", () => {
      const stats = getCacheStats()

      expect(stats.count).toBe(0)
      expect(stats.keys).toEqual([])
      expect(stats.totalSize).toBe(0)
    })
  })
})

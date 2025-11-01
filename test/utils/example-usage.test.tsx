/**
 * Example usage of custom test utilities
 *
 * This file demonstrates how to use the various test utilities
 * in a real test scenario.
 */

import { describe, expect, it } from "vitest"

import {
  // Data utilities
  createMockDataset,
  createMockPerfume,
  createMockUser,
  // Async utilities
  mockAsyncOperation,
  mockFetch,
  // Main utilities
  renderWithProviders,
  // Viewport utilities
  setViewportByName,
  viewportPresets,
  waitForCondition,
} from "./index"

describe("Test Utilities Example Usage", () => {
  describe("Basic Rendering", () => {
    it("should render component with providers", () => {
      const TestComponent = () => <div>Hello World</div>
      const { getByText } = renderWithProviders(<TestComponent />)

      expect(getByText("Hello World")).toBeInTheDocument()
    })
  })

  describe("Mock Data Generation", () => {
    it("should create mock user", () => {
      const user = createMockUser({ name: "John Doe" })

      expect(user).toHaveProperty("id")
      expect(user.name).toBe("John Doe")
      expect(user.email).toBe("test@example.com")
    })

    it("should create mock perfume", () => {
      const perfume = createMockPerfume({ name: "Santal 33" })

      expect(perfume).toHaveProperty("id")
      expect(perfume.name).toBe("Santal 33")
    })

    it("should create mock dataset", () => {
      const dataset = createMockDataset(10, i => ({
        id: i,
        name: `Item ${i}`,
      }))

      expect(dataset).toHaveLength(10)
      expect(dataset[0]).toEqual({ id: 0, name: "Item 0" })
    })
  })

  describe("Viewport Testing", () => {
    it("should set viewport by name", () => {
      setViewportByName("mobile")

      expect(window.innerWidth).toBe(viewportPresets.mobile.width)
      expect(window.innerHeight).toBe(viewportPresets.mobile.height)
    })

    it("should handle different viewport presets", () => {
      const viewports: Array<keyof typeof viewportPresets> = [
        "mobile",
        "tablet",
        "desktop",
      ]

      viewports.forEach(viewport => {
        setViewportByName(viewport)
        expect(window.innerWidth).toBe(viewportPresets[viewport].width)
      })
    })
  })

  describe("Async Testing", () => {
    it("should mock async operation", async () => {
      const mockFn = mockAsyncOperation({ data: "test" }, 10, false)
      const result = await mockFn()

      expect(result).toEqual({ data: "test" })
    })

    it("should wait for condition", async () => {
      let condition = false
      setTimeout(() => {
        condition = true
      }, 50)

      await waitForCondition(() => condition, 1000)

      expect(condition).toBe(true)
    })
  })

  describe("API Mocking", () => {
    it("should mock fetch response", () => {
      const mockResponse = mockFetch({ id: 1, name: "Test" }, 200)

      expect(mockResponse).toBeDefined()
      expect(typeof mockResponse).toBe("function")
    })
  })
})

describe("Test Utilities Integration", () => {
  it("should combine multiple utilities", async () => {
    // Set viewport
    setViewportByName("mobile")
    expect(window.innerWidth).toBe(375)

    // Create mock data
    const user = createMockUser({ role: "admin" })
    expect(user.role).toBe("admin")

    // Mock async operation
    const fetchData = mockAsyncOperation({ users: [user] }, 10)
    const result = await fetchData()

    expect(result.users).toHaveLength(1)
    expect(result.users[0].role).toBe("admin")
  })
})

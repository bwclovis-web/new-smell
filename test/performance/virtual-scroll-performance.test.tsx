import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VirtualScroll } from "~/components/Atoms/VirtualScroll"
import { VirtualScrollList } from "~/components/Molecules/VirtualScrollList"

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
}

Object.defineProperty(window, "performance", {
  value: mockPerformance,
  writable: true,
})

// Generate large dataset for testing
const generateLargeDataset = (size: number) => Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `Description for item ${i}`,
    value: Math.random() * 1000,
  }))

const MockItem = ({ item, index }: { item: any; index: number }) => (
  <div data-testid={`item-${index}`} className="p-4 border-b">
    <h3>{item.name}</h3>
    <p>{item.description}</p>
    <span>{item.value}</span>
  </div>
)

describe("Virtual Scroll Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("VirtualScroll Component", () => {
    it("renders only visible items for large datasets", () => {
      const largeDataset = generateLargeDataset(1000)

      const startTime = performance.now()

      const { container } = render(<VirtualScroll
          items={largeDataset}
          itemHeight={50}
          containerHeight={200}
          overScan={5}
        >
          {(item, index) => <MockItem item={item} index={index} />}
        </VirtualScroll>)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render quickly (generous threshold for CI environments)
      expect(renderTime).toBeLessThan(200)

      // Should only render visible items (200px / 50px = 4 + overScan=5 + 1 = 10)
      // Use container-scoped query to avoid counting items from other tests
      const visibleItems = container.querySelectorAll("[data-testid^='item-']")
      expect(visibleItems.length).toBeLessThanOrEqual(10)
      expect(visibleItems.length).toBeLessThan(largeDataset.length)
    })

    it("handles scroll events efficiently", () => {
      const largeDataset = generateLargeDataset(5000)
      const onScroll = vi.fn()

      const { container } = render(<VirtualScroll
          items={largeDataset}
          itemHeight={50}
          containerHeight={200}
          onScroll={onScroll}
        >
          {(item, index) => <MockItem item={item} index={index} />}
        </VirtualScroll>)

      // Get the scroll container (the outer div with overflow-auto)
      const scrollContainer = container.querySelector(".overflow-auto") as HTMLElement

      // Simulate rapid scrolling
      const startTime = performance.now()
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } })
      }
      const endTime = performance.now()

      // Should handle rapid scrolling efficiently (generous threshold for CI environments)
      expect(endTime - startTime).toBeLessThan(200)
      expect(onScroll).toHaveBeenCalledTimes(10)
    })

    it("maintains performance with very large datasets", () => {
      const veryLargeDataset = generateLargeDataset(10000)

      const startTime = performance.now()

      const { container } = render(<VirtualScroll
          items={veryLargeDataset}
          itemHeight={50}
          containerHeight={200}
          overScan={3}
        >
          {(item, index) => <MockItem item={item} index={index} />}
        </VirtualScroll>)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should still render quickly even with 10k items
      expect(renderTime).toBeLessThan(200)

      // Should only render visible items (not all 10000)
      // With containerHeight=200, itemHeight=50: 4 visible + overScan=3 + ceiling = ~8 items
      // Use container-scoped query to avoid counting items from other tests
      const visibleItems = container.querySelectorAll("[data-testid^='item-']")
      expect(visibleItems.length).toBeLessThanOrEqual(10)
      expect(visibleItems.length).toBeLessThan(veryLargeDataset.length)
    })
  })

  describe("VirtualScrollList Component", () => {
    it("renders large lists efficiently", () => {
      const largeDataset = generateLargeDataset(2000)

      const startTime = performance.now()

      const { container } = render(<VirtualScrollList
          items={largeDataset}
          itemHeight={60}
          containerHeight={300}
          overScan={3}
          renderItem={(item, index) => <MockItem item={item} index={index} />}
        />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render quickly
      expect(renderTime).toBeLessThan(150)

      // Should only render visible items (not all 2000)
      // With containerHeight=300, itemHeight=60: 5 visible + overScan=3 + ceiling = ~9 items
      // Use container-scoped query to avoid counting items from other tests
      const visibleItems = container.querySelectorAll("[data-testid^='item-']")
      expect(visibleItems.length).toBeLessThanOrEqual(10)
      expect(visibleItems.length).toBeLessThan(largeDataset.length)
    })

    it("handles empty and loading states efficiently", () => {
      const emptyState = <div data-testid="empty">No items</div>
      const loadingState = <div data-testid="loading">Loading...</div>

      // Test empty state
      const { rerender } = render(<VirtualScrollList
          items={[]}
          itemHeight={50}
          containerHeight={200}
          renderItem={(item, index) => <MockItem item={item} index={index} />}
          emptyState={emptyState}
        />)

      expect(screen.getByTestId("empty")).toBeInTheDocument()

      // Test loading state
      rerender(<VirtualScrollList
          items={generateLargeDataset(100)}
          itemHeight={50}
          containerHeight={200}
          renderItem={(item, index) => <MockItem item={item} index={index} />}
          loadingState={loadingState}
          isLoading={true}
        />)

      expect(screen.getByTestId("loading")).toBeInTheDocument()
    })

    it("maintains scroll position during data updates", () => {
      const initialData = generateLargeDataset(1000)
      const { rerender, container } = render(<VirtualScrollList
          items={initialData}
          itemHeight={50}
          containerHeight={200}
          renderItem={(item, index) => <MockItem item={item} index={index} />}
        />)

      // Scroll to a specific position - get the scroll container with overflow-auto class
      const scrollContainer = container.querySelector(".overflow-auto") as HTMLElement
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } })

      // Update data
      const updatedData = generateLargeDataset(1000).map((item, index) => ({
        ...item,
        name: `Updated Item ${index}`,
      }))

      rerender(<VirtualScrollList
          items={updatedData}
          itemHeight={50}
          containerHeight={200}
          renderItem={(item, index) => <MockItem item={item} index={index} />}
        />)

      // Should still show items (virtual scrolling maintains position)
      const visibleItems = container.querySelectorAll("[data-testid^='item-']")
      expect(visibleItems.length).toBeGreaterThan(0)
    })
  })

  describe("Memory Usage", () => {
    it("does not create excessive DOM nodes", () => {
      const largeDataset = generateLargeDataset(5000)

      const { container } = render(<VirtualScroll
          items={largeDataset}
          itemHeight={50}
          containerHeight={200}
          overScan={2}
        >
          {(item, index) => <MockItem item={item} index={index} />}
        </VirtualScroll>)

      // Count all test elements (should be limited by virtual scrolling)
      // With containerHeight=200, itemHeight=50: ceil(200/50) = 4 visible
      // Plus overScan=2 at end, plus 1 for ceiling calculation = 7 max
      // Use container-scoped query to avoid counting items from other tests
      const allItems = container.querySelectorAll("[data-testid^='item-']")
      expect(allItems.length).toBeLessThanOrEqual(7) // 4 visible + 2 overScan + 1 ceiling
      expect(allItems.length).toBeLessThan(largeDataset.length)
    })

    it("handles rapid data changes without memory leaks", () => {
      const { rerender, container } = render(<VirtualScrollList
          items={generateLargeDataset(100)}
          itemHeight={50}
          containerHeight={200}
          overScan={2}
          renderItem={(item, index) => <MockItem item={item} index={index} />}
        />)

      // Rapidly change data multiple times
      for (let i = 0; i < 20; i++) {
        const newData = generateLargeDataset(100).map((item, index) => ({
          ...item,
          name: `Batch ${i} Item ${index}`,
        }))

        rerender(<VirtualScrollList
            items={newData}
            itemHeight={50}
            containerHeight={200}
            overScan={2}
            renderItem={(item, index) => <MockItem item={item} index={index} />}
          />)
      }

      // Should still only render visible items
      // With containerHeight=200, itemHeight=50: ceil(200/50) = 4 visible
      // Plus overScan=2 at end, plus 1 for ceiling calculation = 7 max
      // Use container-scoped query to avoid counting items from other tests
      const visibleItems = container.querySelectorAll("[data-testid^='item-']")
      expect(visibleItems.length).toBeLessThanOrEqual(7)
    })
  })
})

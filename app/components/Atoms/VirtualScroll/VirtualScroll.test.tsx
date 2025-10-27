import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import VirtualScroll from './VirtualScroll'

const mockItems = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  value: `Value ${i}`
}))

const MockItem = ({ item, index }: { item: any; index: number }) => (
  <div data-testid={`item-${index}`}>
    {item.name} - {item.value}
  </div>
)

describe('VirtualScroll', () => {
  it('renders visible items only', () => {
    render(<VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
        overscan={2}
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>)

    // Should render only visible items (200px / 50px = 4 items + overscan)
    const visibleItems = screen.queryAllByTestId(/^item-\d+$/)
    expect(visibleItems.length).toBeLessThanOrEqual(8) // 4 visible + 4 overscan
  })

  it('handles scroll events', () => {
    const onScroll = vi.fn()
    const { container } = render(<VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
        onScroll={onScroll}
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>)

    const scrollContainer = container.firstChild as HTMLElement
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } })

    expect(onScroll).toHaveBeenCalledWith(100)
  })

  it('scrolls to specific index', async () => {
    render(<VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
        scrollToIndex={10}
        scrollToAlignment="start"
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>)

    // Wait for the scroll effect to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // The item at index 10 should be visible (it's within the visible range with overscan)
    // Since we have 100 items and container height 200px, item 10 should be visible
    expect(screen.queryByTestId('item-10')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
        className="custom-class"
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>)

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles empty items array', () => {
    const { container } = render(<VirtualScroll
        items={[]}
        itemHeight={50}
        containerHeight={200}
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>)

    // Check that no items are rendered
    const items = container.querySelectorAll('[data-testid^="item-"]')
    expect(items).toHaveLength(0)
  })

  it('calculates correct total height', () => {
    const { container } = render(<VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>)

    // The inner div should have the total height (100 items * 50px = 5000px)
    const innerDiv = container.querySelector('div > div')
    expect(innerDiv).toHaveStyle({ height: '5000px' }) // 100 items * 50px
  })
})

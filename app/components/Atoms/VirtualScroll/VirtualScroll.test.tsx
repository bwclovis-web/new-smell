import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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
    render(
      <VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
        overscan={2}
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>
    )

    // Should render only visible items (200px / 50px = 4 items + overscan)
    const visibleItems = screen.getAllByTestId(/^item-\d+$/)
    expect(visibleItems.length).toBeLessThanOrEqual(8) // 4 visible + 4 overscan
  })

  it('handles scroll events', () => {
    const onScroll = vi.fn()
    render(
      <VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
        onScroll={onScroll}
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>
    )

    const scrollContainer = screen.getByRole('generic')
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } })

    expect(onScroll).toHaveBeenCalledWith(100)
  })

  it('scrolls to specific index', () => {
    render(
      <VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
        scrollToIndex={10}
        scrollToAlignment="start"
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>
    )

    // The item at index 10 should be visible
    expect(screen.getByTestId('item-10')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
        className="custom-class"
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles empty items array', () => {
    render(
      <VirtualScroll
        items={[]}
        itemHeight={50}
        containerHeight={200}
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>
    )

    expect(screen.queryByTestId(/^item-\d+$/)).not.toBeInTheDocument()
  })

  it('calculates correct total height', () => {
    const { container } = render(
      <VirtualScroll
        items={mockItems}
        itemHeight={50}
        containerHeight={200}
      >
        {(item, index) => <MockItem item={item} index={index} />}
      </VirtualScroll>
    )

    const innerDiv = container.querySelector('div > div')
    expect(innerDiv).toHaveStyle({ height: '5000px' }) // 100 items * 50px
  })
})

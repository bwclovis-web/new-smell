export interface VirtualScrollProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  overscan?: number
  className?: string
  children: (item: any, index: number) => React.ReactNode
  onScroll?: (scrollTop: number) => void
  scrollToIndex?: number
  scrollToAlignment?: 'start' | 'center' | 'end'
}

import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useState, useMemo } from 'react'

import LinkCard from '../LinkCard/LinkCard'
import { VirtualScrollList } from '~/components/Molecules/VirtualScrollList'

interface DataDisplaySectionProps {
  data: any[]
  isLoading: boolean
  infiniteLoading: boolean
  hasMore: boolean
  totalCount: number
  observerRef: RefObject<HTMLDivElement>
  onLoadMore: () => void
  type: 'house' | 'perfume'
  selectedLetter: string | null
  scrollContainerRef: RefObject<HTMLDivElement>
  sourcePage?: string
  useVirtualScrolling?: boolean
  virtualScrollThreshold?: number
  itemHeight?: number
  containerHeight?: number
}

const DataDisplaySection = ({
  data,
  isLoading,
  infiniteLoading,
  hasMore,
  totalCount,
  observerRef,
  onLoadMore,
  type,
  selectedLetter,
  scrollContainerRef,
  sourcePage,
  useVirtualScrolling = false,
  virtualScrollThreshold = 50,
  itemHeight = 300,
  containerHeight = 600
}: DataDisplaySectionProps) => {
  const { t } = useTranslation()
  const itemName = type === 'house' ? 'houses' : 'perfumes'
  // const itemNameSingular = type === 'house' ? 'house' : 'perfume'

  // Determine if we should use virtual scrolling
  const shouldUseVirtualScrolling = useVirtualScrolling && data.length > virtualScrollThreshold

  // Render item function for virtual scrolling
  const renderItem = useMemo(() => {
    return (item: any, index: number) => (
      <li key={item.id} className='h-full'>
        <LinkCard
          data={item}
          type={type}
          selectedLetter={selectedLetter}
          sourcePage={sourcePage}
        />
      </li>
    )
  }, [type, selectedLetter, sourcePage])

  if (!selectedLetter && data.length === 0) {
    return (
      <div className="inner-container my-6 text-center py-12">
        <h2 className="text-xl text-noir-gold mb-4">{t('components.dataDisplaySection.heading', { itemName })}</h2>
        <p className="text-noir-gold/80">
          {t('components.dataDisplaySection.subheading', { itemName })}
        </p>
      </div>
    )
  }

  // Virtual scrolling implementation
  if (shouldUseVirtualScrolling) {
    return (
      <div className="inner-container my-6">
        <VirtualScrollList
          items={data}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          overscan={5}
          className="style-scroll"
          renderItem={renderItem}
          itemClassName="h-full"
          listClassName="grid grid-cols-2 gap-6 md:grid-cols-2 2xl:grid-cols-4 auto-rows-fr"
          emptyState={
            <div className="col-span-full text-center py-8">
              <div className="text-noir-gold">Loading {itemName} for letter "{selectedLetter}"...</div>
            </div>
          }
          loadingState={
            <div className="col-span-full text-center py-8">
              <div className="text-noir-gold">Loading {itemName} for letter "{selectedLetter}"...</div>
            </div>
          }
          isLoading={isLoading}
        />

        {/* Load more section for virtual scrolling */}
        <div
          ref={observerRef}
          aria-live="polite"
          aria-busy={infiniteLoading}
          role="status"
          className="sticky bottom-0 w-full bg-gradient-to-t from-noir-black to-transparent flex flex-col items-center justify-center py-4 mt-6"
        >
          {infiniteLoading && (
            <span className="text-noir-gold">Loading more {itemName}...</span>
          )}
          {!infiniteLoading && hasMore && (
            <button
              onClick={onLoadMore}
              className="bg-noir-gold text-noir-black px-4 py-2 rounded-md font-semibold hover:bg-noir-gold/80 transition-all"
            >
              Load More {itemName.charAt(0).toUpperCase() + itemName.slice(1)}
            </button>
          )}
          {!hasMore && data.length > 0 && (
            <span className="text-noir-gold">
              {totalCount > 0 ? `All ${totalCount} ${itemName} loaded.` : `No more ${itemName} to load.`}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className="inner-container my-6 overflow-y-auto style-scroll"
    >
      <ul className="grid grid-cols-2 gap-6 md:grid-cols-2 2xl:grid-cols-4 auto-rows-fr">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="text-noir-gold">Loading {itemName} for letter "{selectedLetter}"...</div>
          </div>
        ) : (
          data.map((item: any) => (
            <li key={item.id} className='h-full'>
              <LinkCard
                data={item}
                type={type}
                selectedLetter={selectedLetter}
                sourcePage={sourcePage}
              />
            </li>
          ))
        )}
      </ul>

      <div
        ref={observerRef}
        aria-live="polite"
        aria-busy={infiniteLoading}
        role="status"
        className="sticky bottom-0 w-full bg-gradient-to-t from-noir-black to-transparent flex flex-col items-center justify-center py-4 mt-6"
      >
        {infiniteLoading && (
          <span className="text-noir-gold">Loading more {itemName}...</span>
        )}
        {!infiniteLoading && hasMore && (
          <button
            onClick={onLoadMore}
            className="bg-noir-gold text-noir-black px-4 py-2 rounded-md font-semibold hover:bg-noir-gold/80 transition-all"
          >
            Load More {itemName.charAt(0).toUpperCase() + itemName.slice(1)}
          </button>
        )}
        {!hasMore && data.length > 0 && (
          <span className="text-noir-gold">
            {totalCount > 0 ? `All ${totalCount} ${itemName} loaded.` : `No more ${itemName} to load.`}
          </span>
        )}
      </div>
    </div>
  )
}

export default DataDisplaySection

import { useRef } from 'react'
import LinkCard from '../LinkCard/LinkCard'

interface DataDisplaySectionProps {
  data: any[]
  isLoading: boolean
  infiniteLoading: boolean
  hasMore: boolean
  totalCount: number
  observerRef: React.RefObject<HTMLDivElement>
  onLoadMore: () => void
  type: 'house' | 'perfume'
  selectedLetter: string | null
  scrollContainerRef: React.RefObject<HTMLDivElement>
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
  scrollContainerRef
}: DataDisplaySectionProps) => {
  const itemName = type === 'house' ? 'houses' : 'perfumes'
  const itemNameSingular = type === 'house' ? 'house' : 'perfume'

  if (!selectedLetter) {
    return (
      <div className="inner-container my-6 text-center py-12">
        <h3 className="text-xl text-noir-gold mb-4">Select a letter to browse {itemName}</h3>
        <p className="text-noir-gold/80">
          Click on any letter above to see {itemName} starting with that letter
        </p>
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className="inner-container my-6 overflow-y-auto style-scroll"
    >
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4 auto-rows-fr">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="text-noir-gold">Loading {itemName} for letter "{selectedLetter}"...</div>
          </div>
        ) : (
          data.map((item: any) => (
            <li key={item.id}>
              <LinkCard data={item} type={type} />
            </li>
          ))
        )}
      </ul>

      {/* Infinite Scroll Observer */}
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

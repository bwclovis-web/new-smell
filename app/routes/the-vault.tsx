export const ROUTE_PATH = '/the-vault'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLocation } from 'react-router'

import AlphabeticalNav from '~/components/Organisms/AlphabeticalNav'
import DataDisplaySection from '~/components/Organisms/DataDisplaySection'
import DataFilters from '~/components/Organisms/DataFilters'
import TitleBanner from '~/components/Organisms/TitleBanner'
import useDataByLetter from '~/hooks/useDataByLetter'
import { useInfiniteScrollPerfumes } from '~/hooks/useInfiniteScrollPerfumes'
import useLetterSelection from '~/hooks/useLetterSelection'
import { getDefaultSortOptions } from '~/utils/sortUtils'

// No server imports needed for client component
import banner from '../images/vault.webp'

export const loader = async () =>
  // Don't load all perfumes upfront - we'll load by letter on demand
  ({})

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('allPerfumes.meta.title') },
    { name: 'description', content: t('allPerfumes.meta.description') }
  ]
}

const AllPerfumesPage = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [selectedSort, setSelectedSort] = useState('created-desc')
  const [isClient, setIsClient] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Get selectedLetter from navigation state
  const initialSelectedLetter = (location.state as { selectedLetter?: string })?.selectedLetter

  const sortOptions = getDefaultSortOptions(t)
  const data = useDataByLetter({ endpoint: '/api/perfumes-by-letter', itemName: 'perfumes' })

  // Ensure hydration compatibility
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Track if we've already processed the initial letter selection
  const [hasProcessedInitialLetter, setHasProcessedInitialLetter] = useState(false)

  // Get letter selection first
  const { selectedLetter, handleLetterClick } = useLetterSelection({
    loadDataByLetter: data.loadDataByLetter,
    resetData: (perfumes, totalCount) => {
      // This will be called when letter changes
      resetPerfumes(perfumes, totalCount)
    }
  })

  // Handle initial letter selection from navigation state
  useEffect(() => {
    if (initialSelectedLetter && initialSelectedLetter !== selectedLetter && !hasProcessedInitialLetter) {
      setHasProcessedInitialLetter(true)
      handleLetterClick(initialSelectedLetter)
    }
  }, [initialSelectedLetter, selectedLetter, hasProcessedInitialLetter])

  // Infinite scroll hook for perfumes - now properly initialized with selected letter
  const {
    perfumes,
    loading: infiniteLoading,
    hasMore,
    totalCount,
    observerRef,
    loadMorePerfumes,
    resetPerfumes
  } = useInfiniteScrollPerfumes({
    letter: selectedLetter || '',
    initialPerfumes: data.initialData,
    scrollContainerRef,
    take: 12
  })

  if (data.error) {
    return <div>Error loading perfumes: {data.error}</div>
  }

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t('allPerfumes.heading')}
        subheading={t('allPerfumes.subheading')}
      />

      <DataFilters
        searchType="perfume"
        sortOptions={sortOptions}
        selectedSort={selectedSort as any}
        onSortChange={evt => setSelectedSort(evt.target.value)}
        className="mb-8"
      />

      <AlphabeticalNav
        selectedLetter={selectedLetter}
        onLetterSelect={handleLetterClick}
        className="mb-8"
      />

      {/* Perfumes Display */}
      {isClient && (
        <DataDisplaySection
          data={perfumes}
          isLoading={data.isLoading}
          infiniteLoading={infiniteLoading}
          hasMore={hasMore}
          totalCount={totalCount}
          observerRef={observerRef}
          onLoadMore={loadMorePerfumes}
          type="perfume"
          selectedLetter={selectedLetter}
          scrollContainerRef={scrollContainerRef}
          sourcePage="vault"
        />
      )}
    </section>
  )
}

export default AllPerfumesPage

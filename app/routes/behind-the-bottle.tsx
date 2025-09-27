export const ROUTE_PATH = '/behind-the-bottle'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLocation } from 'react-router'

import AlphabeticalNav from '~/components/Organisms/AlphabeticalNav'
import DataDisplaySection from '~/components/Organisms/DataDisplaySection'
import DataFilters from '~/components/Organisms/DataFilters'
import TitleBanner from '~/components/Organisms/TitleBanner'
import useDataByLetter from '~/hooks/useDataByLetter'
import { useInfiniteScrollHouses } from '~/hooks/useInfiniteScrollHouses'
import useLetterSelection from '~/hooks/useLetterSelection'
import { getDefaultSortOptions } from '~/utils/sortUtils'

// No server imports needed for client component
import banner from '../images/behind.webp'

export const loader = async () =>
  // Don't load all houses upfront - we'll load by letter on demand
  ({})

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('allHouses.meta.title') },
    { name: 'description', content: t('allHouses.meta.description') }
  ]
}

const useHouseFilters = (t: ReturnType<typeof useTranslation>['t']) => {
  const houseTypeOptions = [
    { id: 'all', value: 'all', label: t('allHouses.houseTypes.all'), name: 'houseType', defaultChecked: true },
    { id: 'niche', value: 'niche', label: t('allHouses.houseTypes.niche'), name: 'houseType', defaultChecked: false },
    { id: 'designer', value: 'designer', label: t('allHouses.houseTypes.designer'), name: 'houseType', defaultChecked: false },
    { id: 'indie', value: 'indie', label: t('allHouses.houseTypes.indie'), name: 'houseType', defaultChecked: false },
    { id: 'celebrity', value: 'celebrity', label: t('allHouses.houseTypes.celebrity'), name: 'houseType', defaultChecked: false },
    { id: 'drugstore', value: 'drugstore', label: t('allHouses.houseTypes.drugstore'), name: 'houseType', defaultChecked: false }
  ]

  const sortOptions = getDefaultSortOptions(t)

  return { houseTypeOptions, sortOptions }
}

const useHouseHandlers = (
  setSelectedHouseType: any,
  setSelectedSort: any
) => {
  const handleHouseTypeChange = (evt: { target: { value: string } }) => {
    setSelectedHouseType(evt.target.value)
  }

  const handleSortChange = (evt: { target: { value: string } }) => {
    setSelectedSort(evt.target.value as any)
  }

  return { handleHouseTypeChange, handleSortChange }
}

const AllHousesPage = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [selectedHouseType, setSelectedHouseType] = useState('all')
  const [selectedSort, setSelectedSort] = useState<any>('created-desc')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Get selectedLetter from navigation state
  const initialSelectedLetter = (location.state as { selectedLetter?: string })?.selectedLetter

  const filters = useHouseFilters(t)
  const data = useDataByLetter({ endpoint: '/api/houses-by-letter-paginated', itemName: 'houses', houseType: selectedHouseType })
  const handlers = useHouseHandlers(setSelectedHouseType, setSelectedSort)

  // Track if we've already processed the initial letter selection
  const [hasProcessedInitialLetter, setHasProcessedInitialLetter] = useState(false)

  // Get letter selection first
  const { selectedLetter, handleLetterClick } = useLetterSelection({
    loadDataByLetter: data.loadDataByLetter,
    resetData: (houses, totalCount) => {
      // This will be called when letter changes
      resetHouses(houses, totalCount)
    }
  })

  // Handle initial letter selection from navigation state
  useEffect(() => {
    if (initialSelectedLetter && initialSelectedLetter !== selectedLetter && !hasProcessedInitialLetter) {
      setHasProcessedInitialLetter(true)
      handleLetterClick(initialSelectedLetter)
    }
  }, [initialSelectedLetter, selectedLetter, hasProcessedInitialLetter])

  // Infinite scroll hook for houses - now properly initialized with selected letter
  const {
    houses,
    loading: infiniteLoading,
    hasMore,
    totalCount,
    observerRef,
    loadMoreHouses,
    resetHouses
  } = useInfiniteScrollHouses({
    letter: selectedLetter || '',
    initialHouses: data.initialData,
    scrollContainerRef,
    take: 12,
    houseType: selectedHouseType
  })

  // Reset houses when data changes (e.g., when filter changes)
  useEffect(() => {
    if (data.initialData.length > 0) {
      resetHouses(data.initialData, data.totalCount)
    }
  }, [data.initialData, data.totalCount, resetHouses])

  if (data.error) {
    return <div>Error loading houses: {data.error}</div>
  }

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t('allHouses.heading')}
        subheading={t('allHouses.subheading')}
      />

      <DataFilters
        searchType="perfume-house"
        sortOptions={filters.sortOptions}
        typeOptions={filters.houseTypeOptions}
        selectedSort={selectedSort}
        selectedType={selectedHouseType}
        onSortChange={handlers.handleSortChange}
        onTypeChange={handlers.handleHouseTypeChange}
        className="mb-8"
      />

      <AlphabeticalNav
        selectedLetter={selectedLetter}
        onLetterSelect={handleLetterClick}
        className="mb-8"
      />

      {/* Houses Display */}
      <DataDisplaySection
        data={houses}
        isLoading={data.isLoading}
        infiniteLoading={infiniteLoading}
        hasMore={hasMore}
        totalCount={totalCount}
        observerRef={observerRef as React.RefObject<HTMLDivElement>}
        onLoadMore={loadMoreHouses}
        type="house"
        selectedLetter={selectedLetter}
        scrollContainerRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
        sourcePage="behind-the-bottle"
        useVirtualScrolling={true}
        virtualScrollThreshold={20}
        itemHeight={320}
        containerHeight={600}
      />
    </section>
  )
}

export default AllHousesPage

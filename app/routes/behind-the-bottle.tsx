export const ROUTE_PATH = '/behind-the-bottle'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction, NavLink } from 'react-router'

import RadioSelect from '~/components/Atoms/RadioSelect/RadioSelect'
import Select from '~/components/Atoms/Select/Select'
import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import SearchBar from '~/components/Organisms/SearchBar/SearchBar'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import { useInfiniteScrollHouses } from '~/hooks/useInfiniteScrollHouses'

// No server imports needed for client component
import banner from '../images/house.webp'

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

  const sortOptions = [
    { id: 'created-desc', value: 'created-desc', label: t('allHouses.sortOptions.created-desc'), name: 'sortBy', defaultChecked: true },
    { id: 'created-asc', value: 'created-asc', label: t('allHouses.sortOptions.created-asc'), name: 'sortBy', defaultChecked: false },
    { id: 'name-asc', value: 'name-asc', label: t('allHouses.sortOptions.name-asc'), name: 'sortBy', defaultChecked: false },
    { id: 'name-desc', value: 'name-desc', label: t('allHouses.sortOptions.name-desc'), name: 'sortBy', defaultChecked: false },
    { id: 'type-asc', value: 'type-asc', label: t('allHouses.sortOptions.type-asc'), name: 'sortBy', defaultChecked: false }
  ]

  return { houseTypeOptions, sortOptions }
}

const useHouseData = () => {
  const [initialHouses, setInitialHouses] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHousesData = async (letter: string) => {
    const response = await fetch(`/api/houses-by-letter-paginated?letter=${letter}&skip=0&take=12`)
    if (!response.ok) {
      throw new Error(`Failed to fetch houses: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch houses')
    }
    return data
  }

  const loadHousesByLetter = async (letter: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchHousesData(letter)
      const houses = data.houses
      const count = data.meta?.totalCount || houses.length

      setInitialHouses(houses)
      setTotalCount(count)

      return { houses, totalCount: count }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load houses'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { initialHouses, totalCount, isLoading, error, loadHousesByLetter }
}

const useHouseHandlers = (
  setSelectedHouseType: any,
  setSelectedSort: any
) => {
  const handleHouseTypeChange = (evt: { target: { value: string } }) => {
    setSelectedHouseType(evt.target.value)
  }

  const handleSortChange = (evt: { target: { value: string } }) => {
    setSelectedSort(evt.target.value)
  }

  return { handleHouseTypeChange, handleSortChange }
}

const HouseFiltersSection = ({
  t,
  houseTypeOptions,
  sortOptions,
  onHouseTypeChange,
  onSortChange
}: {
  t: ReturnType<typeof useTranslation>['t']
  houseTypeOptions: any[]
  sortOptions: any[]
  onHouseTypeChange: any
  onSortChange: any
}) => (
  <div className="space-y-6 inner-container py-4 flex flex-col md:flex-row md:justify-between md:items-center noir-border">
    <div className='w-1/4 mb-0'>
      <SearchBar searchType={'perfume-house'} />
    </div>

    <div className='flex flex-col md:flex-row gap-6 w-full md:w-3/4 justify-end items-end md:items-center'>
      <div>
        <h3 className="mb-2">{t('allHouses.filters.houseType')}</h3>
        <Select
          selectData={houseTypeOptions}
          action={onHouseTypeChange}
          className="flex-wrap"
          selectId="house-type"
        />
      </div>

      <div>
        <h3 className="mb-2">{t('allHouses.filters.sortBy')}</h3>
        <Select
          selectData={sortOptions}
          action={onSortChange}
          className="flex-wrap"
          selectId="sort-by"
        />
      </div>
    </div>
  </div>
)

const AllHousesPage = () => {
  const { t } = useTranslation()
  const [selectedHouseType, setSelectedHouseType] = useState('all')
  const [selectedSort, setSelectedSort] = useState('created-desc')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const filters = useHouseFilters(t)
  const data = useHouseData()
  const handlers = useHouseHandlers(setSelectedHouseType, setSelectedSort)

  // Generate alphabet array
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

  // Ensure hydration compatibility
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Infinite scroll hook for houses
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
    initialHouses: data.initialHouses,
    scrollContainerRef,
    take: 12
  })



  const handleLetterClick = async (letter: string) => {
    if (selectedLetter === letter) {
      // Deselect the letter
      setSelectedLetter(null)
      return
    }

    // Select new letter and load houses
    setSelectedLetter(letter)
    const fetchedData = await data.loadHousesByLetter(letter)

    // Initialize the infinite scroll hook with the new houses using the returned data
    if (fetchedData && fetchedData.houses.length > 0) {
      resetHouses(fetchedData.houses, fetchedData.totalCount)
    }
  }

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

      <HouseFiltersSection
        t={t}
        houseTypeOptions={filters.houseTypeOptions}
        sortOptions={filters.sortOptions}
        onHouseTypeChange={handlers.handleHouseTypeChange}
        onSortChange={handlers.handleSortChange}
      />

      {/* Alphabetical Navigation */}
      <div className="inner-container mb-6">
        <div className="noir-border p-4">
          <h3 className="text-lg font-semibold text-noir-gold mb-4 text-center">
            Browse Houses by Letter
          </h3>
          <div className="grid grid-cols-6 md:grid-cols-13 gap-2">
            {alphabet.map(letter => (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                className={`p-3 text-center rounded-lg transition-colors font-semibold ${selectedLetter === letter
                  ? 'bg-noir-gold text-noir-black'
                  : 'noir-border hover:bg-noir-gold/10 text-noir-gold'
                  }`}
              >
                {letter}
              </button>
            ))}
          </div>
          {isClient && selectedLetter && (
            <div className="mt-4 text-center">
              <p className="text-noir-gold mb-2">
                Showing houses starting with "{selectedLetter}" ({totalCount > 0 ? `${houses.length} of ${totalCount}` : houses.length} total)
              </p>
              <button
                onClick={() => {
                  setSelectedLetter(null)
                  // Clear houses when showing all
                }}
                className="text-noir-gold hover:text-noir-gold/80 underline"
              >
                Show all houses
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Houses Display */}
      {isClient && selectedLetter ? (
        <div
          ref={scrollContainerRef}
          className="inner-container my-6  overflow-y-auto style-scroll"
        >
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4 auto-rows-fr">
            {data.isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="text-noir-gold">Loading houses for letter "{selectedLetter}"...</div>
              </div>
            ) : (
              houses.map((house: any) => (
                <li key={house.id}>
                  <LinkCard data={house} type="house" />
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
              <span className="text-noir-gold">Loading more houses...</span>
            )}
            {!infiniteLoading && hasMore && (
              <button
                onClick={loadMoreHouses}
                className="bg-noir-gold text-noir-black px-4 py-2 rounded-md font-semibold hover:bg-noir-gold/80 transition-all"
              >
                Load More Houses
              </button>
            )}
            {!hasMore && houses.length > 0 && (
              <span className="text-noir-gold">
                {totalCount > 0 ? `All ${totalCount} houses loaded.` : 'No more houses to load.'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="inner-container my-6 text-center py-12">
          <h3 className="text-xl text-noir-gold mb-4">Select a letter to browse houses</h3>
          <p className="text-noir-gold/80">
            Click on any letter above to see perfume houses starting with that letter
          </p>
        </div>
      )}
    </section>
  )
}

export default AllHousesPage

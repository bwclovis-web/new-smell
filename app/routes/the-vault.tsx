export const ROUTE_PATH = '/the-vault'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction } from 'react-router'

import AlphabeticalNav from '~/components/Organisms/AlphabeticalNav/AlphabeticalNav'
import DataFilters from '~/components/Organisms/DataFilters/DataFilters'
import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import { useInfiniteScrollPerfumes } from '~/hooks/useInfiniteScrollPerfumes'
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

const usePerfumeData = () => {
  const [initialPerfumes, setInitialPerfumes] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPerfumesData = async (letter: string) => {
    const response = await fetch(`/api/perfumes-by-letter?letter=${letter}&skip=0&take=12`)
    if (!response.ok) {
      throw new Error(`Failed to fetch perfumes: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch perfumes')
    }
    return data
  }

  const loadPerfumesByLetter =
    async (letter: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchPerfumesData(letter)
        const perfumes = data.perfumes
        const count = data.meta?.totalCount || perfumes.length

        setInitialPerfumes(perfumes)
        setTotalCount(count)

        return { perfumes, totalCount: count }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load perfumes'
        setError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    }

  return { initialPerfumes, totalCount, isLoading, error, loadPerfumesByLetter }
}

const AllPerfumesPage = () => {
  const { t } = useTranslation()
  const [selectedSort, setSelectedSort] = useState('created-desc')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const sortOptions = getDefaultSortOptions(t)
  const data = usePerfumeData()

  // Ensure hydration compatibility
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Infinite scroll hook for perfumes
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
    initialPerfumes: data.initialPerfumes,
    scrollContainerRef,
    take: 12
  })

  const handleLetterClick = async (letter: string | null) => {
    if (letter === null) {
      setSelectedLetter(null)
      return
    }

    if (selectedLetter === letter) {
      // Deselect the letter
      setSelectedLetter(null)
      return
    }

    // Select new letter and load perfumes
    setSelectedLetter(letter)
    const fetchedData = await data.loadPerfumesByLetter(letter)

    // Initialize the infinite scroll hook with the new perfumes using the returned data
    if (fetchedData && fetchedData.perfumes.length > 0) {
      resetPerfumes(fetchedData.perfumes, fetchedData.totalCount)
    }
  }

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
      {isClient && selectedLetter ? (
        <div
          ref={scrollContainerRef}
          className="inner-container my-6 overflow-y-auto style-scroll"
        >
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4 auto-rows-fr">
            {data.isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="text-noir-gold">Loading perfumes for letter "{selectedLetter}"...</div>
              </div>
            ) : (
              perfumes.map((perfume: any) => (
                <li key={perfume.id}>
                  <LinkCard data={perfume} type="perfume" />
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
              <span className="text-noir-gold">Loading more perfumes...</span>
            )}
            {!infiniteLoading && hasMore && (
              <button
                onClick={loadMorePerfumes}
                className="bg-noir-gold text-noir-black px-4 py-2 rounded-md font-semibold hover:bg-noir-gold/80 transition-all"
              >
                Load More Perfumes
              </button>
            )}
            {!hasMore && perfumes.length > 0 && (
              <span className="text-noir-gold">
                {totalCount > 0 ? `All ${totalCount} perfumes loaded.` : 'No more perfumes to load.'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="inner-container my-6 text-center py-12">
          <h3 className="text-xl text-noir-gold mb-4">Select a letter to browse perfumes</h3>
          <p className="text-noir-gold/80">
            Click on any letter above to see perfumes starting with that letter
          </p>
        </div>
      )}
    </section>
  )
}

export default AllPerfumesPage

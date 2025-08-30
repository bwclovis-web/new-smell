import { useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import { type MetaFunction } from 'react-router'

import AlphabeticalNav from '~/components/Organisms/AlphabeticalNav/AlphabeticalNav'
import DataFilters from '~/components/Organisms/DataFilters/DataFilters'
import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import { getDefaultSortOptions } from '~/utils/sortUtils'

export const ROUTE_PATH = '/the-vault'

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

import banner from '../images/vault.webp'

const usePerfumeData = () => {
  const [perfumes, setPerfumes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPerfumesByLetter = async (letter: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/perfumes-by-letter?letter=${letter}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch perfumes: ${response.status}`)
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch perfumes')
      }

      setPerfumes(data.perfumes || [])
      return data.perfumes || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load perfumes'
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  return { perfumes, isLoading, error, loadPerfumesByLetter, setPerfumes }
}

const AllPerfumesPage = () => {
  const { t } = useTranslation()
  const [selectedSort, setSelectedSort] = useState('created-desc')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const sortOptions = getDefaultSortOptions(t)
  const data = usePerfumeData()

  // Ensure hydration compatibility
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sort perfumes when they change
  const sortedPerfumes = [...data.perfumes].sort((perfumeA, perfumeB) => {
    switch (selectedSort) {
      case 'name-asc':
        return perfumeA.name.localeCompare(perfumeB.name)
      case 'name-desc':
        return perfumeB.name.localeCompare(perfumeA.name)
      case 'created-asc':
        return new Date(perfumeA.createdAt).getTime() - new Date(perfumeB.createdAt).getTime()
      case 'created-desc':
      default:
        return new Date(perfumeB.createdAt).getTime() - new Date(perfumeA.createdAt).getTime()
    }
  })

  const handleSortChange = (evt: { target: { value: string } }) => {
    setSelectedSort(evt.target.value)
  }

  const handleLetterSelect = async (letter: string | null) => {
    if (letter === null) {
      setSelectedLetter(null)
      data.setPerfumes([])
      return
    }

    if (selectedLetter === letter) {
      // Deselect the letter
      setSelectedLetter(null)
      data.setPerfumes([])
      return
    }

    // Select new letter and load perfumes
    setSelectedLetter(letter)
    await data.loadPerfumesByLetter(letter)
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

      {/* Filters */}
      <DataFilters
        searchType="perfume"
        sortOptions={sortOptions}
        selectedSort={selectedSort as any}
        onSortChange={handleSortChange}
        className="mb-8"
      />

      {/* Alphabetical Navigation */}
      <AlphabeticalNav
        selectedLetter={selectedLetter}
        onLetterSelect={handleLetterSelect}
        className="mb-8"
      />

      {/* Perfumes Display */}
      {isClient && selectedLetter ? (
        <div className="inner-container my-6">
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4 auto-rows-fr">
            {data.isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="text-noir-gold">
                  Loading perfumes for letter "{selectedLetter}"...
                </div>
              </div>
            ) : (
              sortedPerfumes.map(perfume => (
                <li key={perfume.id}>
                  <LinkCard data={perfume} type="perfume" />
                </li>
              ))
            )}
          </ul>

          {!data.isLoading && sortedPerfumes.length === 0 && (
            <div className="text-center py-8">
              <div className="text-noir-gold">
                No perfumes found starting with "{selectedLetter}"
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="inner-container my-6 text-center py-12">
          <h3 className="text-xl text-noir-gold mb-4">
            Select a letter to browse perfumes
          </h3>
          <p className="text-noir-gold/80">
            Click on any letter above to see perfumes starting with that letter
          </p>
        </div>
      )}
    </section>
  )
}

export default AllPerfumesPage

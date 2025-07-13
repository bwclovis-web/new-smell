export const ROUTE_PATH = '/all-houses'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction } from 'react-router'

import RadioSelect from '~/components/Atoms/RadioSelect/RadioSelect'
import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import SearchBar from '~/components/Organisms/SearchBar/SearchBar'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import { useHousesWithLocalCache } from '~/hooks/useHousesWithLocalCache'
import { getAllHouses } from '~/models/house.server'

import banner from '../images/house.webp'

export const loader = async () => {
  const allHouses = await getAllHouses()
  return { allHouses }
}

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

const useHouseData = (selectedHouseType: string, selectedSort: string) => {
  const { data: filteredHouses = [], isLoading, error } = useHousesWithLocalCache({
    houseType: selectedHouseType,
    sortBy: selectedSort
  })

  return { filteredHouses, isLoading, error }
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

    <div className='flex flex-col md:flex-row gap-4 w-full md:w-3/4 justify-end items-end md:items-center'>
      <div>
        <h3 className="text-lg font-medium mb-2">{t('allHouses.filters.houseType')}</h3>
        <RadioSelect
          data={houseTypeOptions}
          handleRadioChange={onHouseTypeChange}
          className="flex-wrap"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">{t('allHouses.filters.sortBy')}</h3>
        <RadioSelect
          data={sortOptions}
          handleRadioChange={onSortChange}
          className="flex-wrap"
        />
      </div>
    </div>
  </div>
)

const AllHousesPage = () => {
  const { t } = useTranslation()
  const [selectedHouseType, setSelectedHouseType] = useState('all')
  const [selectedSort, setSelectedSort] = useState('created-desc')

  const filters = useHouseFilters(t)
  const data = useHouseData(selectedHouseType, selectedSort)
  const handlers = useHouseHandlers(setSelectedHouseType, setSelectedSort)

  if (data.error) {
    return <div>Error loading houses: {data.error.message}</div>
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

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4 inner-container my-6 auto-rows-fr">
        {data.isLoading ? (
          <div>Loading houses...</div>
        ) : (
          data.filteredHouses.map((house: any) => (
            <li key={house.id}>
              <LinkCard data={house} type="house" />
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

export default AllHousesPage

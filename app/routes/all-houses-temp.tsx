export const ROUTE_PATH = '/all-houses'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction } from 'react-router'

import RadioSelect from '~/components/Atoms/RadioSelect/RadioSelect'
import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
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
  const [filteredHouses, setFilteredHouses] = useState<any[]>([])

  useEffect(() => {
    const fetchFilteredData = async () => {
      const params = new URLSearchParams({
        houseType: selectedHouseType,
        sortBy: selectedSort
      })
      const response = await fetch(`/api/houseSortLoader?${params}`)
      const data = await response.json()
      setFilteredHouses(data)
    }
    fetchFilteredData()
  }, [selectedHouseType, selectedSort])

  return filteredHouses
}

const AllHousesPage = () => {
  const { t } = useTranslation()
  const [selectedHouseType, setSelectedHouseType] = useState('all')
  const [selectedSort, setSelectedSort] = useState('created-desc')

  const { houseTypeOptions, sortOptions } = useHouseFilters(t)
  const filteredHouses = useHouseData(selectedHouseType, selectedSort)

  const handleHouseTypeChange = (evt: { target: { value: string } }) => {
    setSelectedHouseType(evt.target.value)
  }

  const handleSortChange = (evt: { target: { value: string } }) => {
    setSelectedSort(evt.target.value)
  }

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t('allHouses.heading')}
        subheading={t('allHouses.subheading')}
      />

      <div className="space-y-4 mb-6">
        <div>
          <h3 className="text-lg font-medium mb-2">{t('allHouses.filters.houseType')}</h3>
          <RadioSelect
            data={houseTypeOptions}
            handleRadioChange={handleHouseTypeChange}
            className="flex-wrap"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">{t('allHouses.filters.sortBy')}</h3>
          <RadioSelect
            data={sortOptions}
            handleRadioChange={handleSortChange}
            className="flex-wrap"
          />
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
        {filteredHouses.map(house => (
          <li key={house.id}>
            <LinkCard data={house} type="house" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AllHousesPage

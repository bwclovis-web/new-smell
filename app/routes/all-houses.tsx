export const ROUTE_PATH = '/all-houses'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLoaderData } from 'react-router'

import { Button } from '~/components/Atoms/Button/Button'
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

const AllHousesPage = () => {
  const { t } = useTranslation()
  const { allHouses } = useLoaderData<typeof loader>()
  const [sortByType, setSortByType] = useState(false)
  const [sortedHouses, setSortedHouses] = useState(allHouses)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/houseSortLoader?sortByType=${sortByType}`)
      const data = await res.json()
      setSortedHouses(data)
    }
    fetchData()
  }, [sortByType])

  return (
    <section>
      <TitleBanner image={banner} heading={t('allHouses.heading')} subheading={t('allHouses.subheading')} ></TitleBanner>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setSortByType(prev => !prev)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded relative"
      >
        {sortByType ? t('allHouses.button.byCreated') : t('allHouses.button.byType')}
      </Button>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
        {sortedHouses.map(house => (
          <li key={house.id}>
            <LinkCard data={house} type="house" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AllHousesPage

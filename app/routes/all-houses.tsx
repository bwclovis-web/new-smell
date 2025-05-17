export const ROUTE_PATH = '/all-houses'
import { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import { getAllHouses } from '~/models/house.server'

export const loader = async () => {
  const allHouses = await getAllHouses()
  return { allHouses }
}

const AllHousesPage = () => {
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
      <header className="mb-4">
        <h1>All Houses</h1>
        <p>List of all houses will be displayed here.</p>
        <button
          onClick={() => setSortByType(prev => !prev)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {sortByType ? 'Unsort' : 'Sort by Type'}
        </button>
      </header>
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

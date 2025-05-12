export const ROUTE_PATH = '/all-houses'
import { useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import { getAllHouses } from '~/models/house.server'

export const loader = async () => {
  const allHouses = await getAllHouses()
  return { allHouses }
}

const AllHousesPage = () => {
  const { allHouses } = useLoaderData<typeof loader>()
  return (
    <section>
      <header className="mb-4">
        <h1>All Houses</h1>
        <p>List of all houses will be displayed here.</p>
      </header>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
        {allHouses.map(house => (
          <li key={house.id}>
            <LinkCard data={house} type="house" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AllHousesPage

export const ROUTE_PATH = '/all-houses'
import { NavLink, useLoaderData } from 'react-router'

import { getAllHouses } from '~/models/house.server'

export const loader = async () => {
  const allHouses = await getAllHouses()
  return { allHouses }
}

const AllHousesPage = () => {
  const { allHouses } = useLoaderData<typeof loader>()
  return (
    <div>
      <h1>All Houses</h1>
      <p>List of all houses will be displayed here.</p>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allHouses.map(house => (
          <li key={house.id}>
            <NavLink to={`/perfume-house/${house.name}`} className="block p-4 border rounded-lg hover:bg-gray-100">
              <img
                src={house.image}
                alt={house.name}
                className="w-48 h-48 object-cover rounded-full mb-2"
              />
              {house.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AllHousesPage

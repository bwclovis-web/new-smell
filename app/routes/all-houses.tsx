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
    <section>
      <header className="mb-4">
        <h1>All Houses</h1>
        <p>List of all houses will be displayed here.</p>
      </header>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
        {allHouses.map(house => (
          <li key={house.id}>
            <NavLink
              viewTransition
              to={`/perfume-house/${house.name}`}
              className=" p-4 flex justify-between items-center gap-4 noir-outline"
            >
              <img
                src={house.image}
                alt={house.name}
                className="w-58 h-50 object-cover mb-2 min-w-1/2"
              />
              <div className="w-1/2">
                <h2 className="text-2xl font-semibold">{house.name}</h2>
                <p className="text-sm text-gray-500">{house.description}</p>
              </div>
            </NavLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AllHousesPage

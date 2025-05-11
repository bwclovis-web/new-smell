import { NavLink, useLoaderData } from 'react-router'

import { getAllPerfumes } from '~/models/perfume.server'

export const ROUTE_PATH = '/all-perfumes'

export const loader = async () => {
  const allPerfumes = await getAllPerfumes()
  return { allPerfumes }
}

const AllPerfumesPage = () => {
  const { allPerfumes } = useLoaderData<typeof loader>()
  return (
    <div>
      <h1>All Perfumes</h1>
      <p>This is the All Perfumes page.</p>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allPerfumes?.map(perfume => (
          <li key={perfume.id}>
            <NavLink className="block p-4 border rounded-lg hover:bg-gray-100" to={`/perfume/${perfume.name}`}>
              <img
                src={perfume.image}
                alt={perfume.name}
                className="w-48 h-48 object-cover rounded-full mb-2"
              />
              {perfume.name}
              {' '}
              by
              {perfume?.perfumeHouse?.name}
            </NavLink>
          </li>
        ))}

      </ul>
    </div>
  )
}

export default AllPerfumesPage

import { type LoaderFunctionArgs, NavLink, useLoaderData, useNavigate } from 'react-router'

import { getPerfumeHouseByName } from '~/models/house.server'

import { ROUTE_PATH as ALL_HOUSES } from './all-houses'
export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.houseId) {
    throw new Error('Note ID is required')
  }
  const perfumeHouse = await getPerfumeHouseByName(params.houseId)
  if (!perfumeHouse) {
    throw new Response('House not found', { status: 404 })
  }
  return { perfumeHouse }
}

export const ROUTE_PATH = '/house-details/:houseId'
const HouseDetailPage = () => {
  const { perfumeHouse } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const handleDelete = async () => {
    const url = `/api/deleteHouse?id=${perfumeHouse.id}`
    const res = await fetch(url)
    if (res.ok) {
      navigate(ALL_HOUSES)
    } else {
      console.error('Failed to delete the house')
    }
  }

  console.log('perfumeHouse', perfumeHouse)

  return (
    <>
      <header>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1>{perfumeHouse.name}</h1>
            <p className="text-lg">
              <span>Founded:</span>
              {' '}
              {perfumeHouse.founded}
            </p>
          </div>
          <button onClick={() => handleDelete()}>G'BYE</button>
        </div>
      </header>
      <section className="flex gap-20">
        <div className="w-1/2 noir-outline rounded-b-lg">
          <img
            src={perfumeHouse.image}
            alt={perfumeHouse.name}
            className="w-full h-58 object-cover mb-2 rounded-t-lg"
          />
          <div className="px-6">
            <p>{perfumeHouse.description}</p>
            <address className="flex items-center gap-4 border py-2 rounded-md bg-noir-dark text-noir-light px-2 my-6">
              <div className="w-1/2">
                <p className="text-sm">
                  <span className="font-medium text-lg">Address:</span>
                  {' '}
                  {perfumeHouse.address}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-lg">Country:</span>
                  {' '}
                  {perfumeHouse.country}
                </p>
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium text-lg">Email:</span>
                  {' '}
                  {perfumeHouse.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-lg">Phone:</span>
                  {' '}
                  {perfumeHouse.phone}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-lg">Website:</span>
                  {' '}
                  <a href={perfumeHouse.website} target="_blank" rel="noopener noreferrer">
                    {perfumeHouse.website}
                  </a>
                </p>
              </div>
            </address>
          </div>
        </div>
        {perfumeHouse.perfumes.length > 0 && (
          <div className="w-1/2 rounded-b-lg">
            <h2 className="text-2xl font-bold mb-4">Perfumes</h2>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 p-2">
              {perfumeHouse.perfumes.map(perfume => (
                <li key={perfume.id}>
                  <NavLink to={`/perfume/${perfume.name}`} className="block p-2 noir-outline hover:bg-gray-100 hover:-rotate-2 hover:scale-110 hover:drop-shadow-lg  transition-all duration-300 ease-in-out">
                    <img
                      src={perfume.image}
                      alt={perfume.name}
                      className="w-48 h-48 object-cover rounded-full mb-2"
                    />
                    <span className="text-center block text-lg tracking-wide font-semibold text-noir-light bg-noir-gray rounded-md">{perfume.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  )
}

export default HouseDetailPage

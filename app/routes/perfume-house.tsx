import { useTranslation } from 'react-i18next'
import { MdDeleteForever } from 'react-icons/md'
import { type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData, useNavigate } from 'react-router'

import PerfumeHouseAddressBlock from '~/components/Containers/PerfumeHouse/AddressBlock/PerfumeHouseAddressBlock'
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

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('singleHouse.title') },
    { name: 'description', content: t('allPerfumes.description') }
  ]
}

export const ROUTE_PATH = '/perfume-house'
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

  return (
    <section>
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
          <button onClick={() => handleDelete()} aria-label="delete" className="bg-red-600/60 hover:bg-red-600/90 rounded-full p-2 cursor-pointer border-2 border-red-600/60 hover:border-red-600/90 transition-all duration-300 ease-in-out">
            <MdDeleteForever size={40} fill="white" />
          </button>
          <NavLink
            viewTransition
            to={`/admin/perfume-house/${perfumeHouse.name}/edit`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Edit
          </NavLink>
        </div>
      </header>
      <div className="flex gap-20">
        <div className="w-1/2 noir-outline rounded-b-lg">
          <img
            src={perfumeHouse.image}
            alt={perfumeHouse.name}
            className="w-full h-58 object-cover mb-2 rounded-t-lg"
          />
          <div className="px-6">
            <p>{perfumeHouse.description}</p>
            <PerfumeHouseAddressBlock perfumeHouse={perfumeHouse} />
          </div>
        </div>
        {perfumeHouse.perfumes.length > 0 && (
          <div className="w-1/2 rounded-b-lg">
            <h2 className="text-2xl font-bold mb-4">Perfumes</h2>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 p-2">
              {perfumeHouse.perfumes.map(perfume => (
                <li key={perfume.id}>
                  <NavLink
                    viewTransition
                    to={`/perfume/${perfume.name}`}
                    className="block p-2 noir-outline hover:bg-gray-100 hover:-rotate-2 hover:scale-110 hover:drop-shadow-lg  transition-all duration-300 ease-in-out"
                  >
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
      </div>
    </section>
  )
}

export default HouseDetailPage

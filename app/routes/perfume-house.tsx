import { type LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router'

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

  return (
    <header>
      <div>
        <h1 className="details-title">{perfumeHouse.name}</h1>
        <button onClick={() => handleDelete()}>G'BYE</button>
      </div>
      <p>{perfumeHouse.description}</p>
    </header>
  )
}

export default HouseDetailPage

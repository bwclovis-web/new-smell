import { type LoaderFunctionArgs, useLoaderData } from 'react-router'

import { getPerfumeHouseByName } from '~/models/house.server'
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

  return (
    <div>
      <h1>{perfumeHouse.name}</h1>
      <p>{perfumeHouse.description}</p>
    </div>
  )
}

export default HouseDetailPage

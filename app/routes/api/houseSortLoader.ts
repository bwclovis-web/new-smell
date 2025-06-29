import type { LoaderFunctionArgs } from 'react-router'

import { getAllHouses } from '~/models/house.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const sortByType = url.searchParams.get('sortByType')
  const houseType = url.searchParams.get('houseType')
  const sortBy = url.searchParams.get('sortBy')

  const options = {
    sortByType: sortByType === 'true',
    houseType: houseType || 'all',
    sortBy: sortBy as 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'type-asc' | undefined
  }

  const result = await getAllHouses(options)
  return result || []
}

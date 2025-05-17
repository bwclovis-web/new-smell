import type { LoaderFunctionArgs } from 'react-router'

import { getAllHouses } from '~/models/house.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const sortByType = url.searchParams.get('sortByType')

  if (sortByType === null) {
    return []
  }

  const sortByTypeBool = sortByType === 'true' ? true : sortByType === 'false' ? false : undefined
  const result = await getAllHouses(sortByTypeBool)
  return result ? result : []
}

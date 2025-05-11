import type { LoaderFunctionArgs } from 'react-router'

import { deletePerfumeHouse } from '~/models/house.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return []
  }
  const result = await deletePerfumeHouse(id)
  return result ? result : []
}

import type { LoaderFunctionArgs } from 'react-router'

import { getHousesPaginated } from '~/models/house.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const sortByType = url.searchParams.get('sortByType')
  const houseType = url.searchParams.get('houseType')
  const sortBy = url.searchParams.get('sortBy')
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)

  // Calculate skip value for pagination
  const skip = (page - 1) * limit

  const options = {
    sortByType: sortByType === 'true',
    houseType: houseType || 'all',
    sortBy: sortBy as 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'type-asc' | undefined,
    skip,
    take: limit,
    selectFields: true // Only return essential fields to reduce response size
  }

  const result = await getHousesPaginated(options)
  return result || { houses: [], count: 0, hasMore: false, currentPage: 1, totalPages: 1 }
}

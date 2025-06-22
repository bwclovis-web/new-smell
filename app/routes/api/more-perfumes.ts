import type { LoaderFunctionArgs } from 'react-router'

import { getPerfumeHouseByName } from '~/models/house.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const houseId = url.searchParams.get('houseId')
  const skip = parseInt(url.searchParams.get('skip') || '0', 10)
  const take = parseInt(url.searchParams.get('take') || '9', 10)

  if (!houseId) {
    return Response.json({
      success: false,
      message: 'House ID is required',
      perfumes: []
    }, { status: 400 })
  }

  try {
    // Fetch house with perfumes using pagination
    const house = await getPerfumeHouseByName(houseId, { skip, take })

    if (!house) {
      return Response.json({
        success: false,
        message: 'House not found',
        perfumes: []
      }, { status: 404 })
    }

    // Return the perfumes
    return Response.json({
      success: true,
      perfumes: house.perfumes || [],
      meta: {
        houseName: house.name,
        skip,
        take,
        hasMore: (house.perfumes?.length || 0) === take
      }
    })
  } catch {
    return Response.json({
      success: false,
      message: 'Failed to fetch perfumes',
      perfumes: []
    }, { status: 500 })
  }
}

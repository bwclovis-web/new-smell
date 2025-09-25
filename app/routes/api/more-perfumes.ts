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

    // Return the perfumes - compression is handled by Express middleware
    const perfumes = house.perfumes || []
    return Response.json({
      success: true,
      perfumes,
      meta: {
        houseName: house.name,
        skip,
        take,
        hasMore: perfumes.length === take,
        count: perfumes.length
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600', // 10 minute cache
        'X-Data-Size': JSON.stringify(perfumes).length.toString()
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

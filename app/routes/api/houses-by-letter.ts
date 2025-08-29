import type { LoaderFunctionArgs } from 'react-router'

import { getHousesByLetter } from '~/models/house.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const letter = url.searchParams.get('letter')

  if (!letter || !/^[A-Za-z]$/.test(letter)) {
    return Response.json({
      success: false,
      message: 'Valid letter parameter is required',
      houses: []
    }, { status: 400 })
  }

  try {
    const houses = await getHousesByLetter(letter.toUpperCase())

    return Response.json({
      success: true,
      houses,
      count: houses.length
    })
  } catch (error) {
    console.error('Error fetching houses by letter:', error)
    return Response.json({
      success: false,
      message: 'Failed to fetch houses',
      houses: []
    }, { status: 500 })
  }
}

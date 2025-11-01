import type { LoaderFunctionArgs } from 'react-router'

import { getHousesByLetter } from '~/models/house.server'
import { assertValid, withLoaderErrorHandling } from '~/utils/errorHandling.patterns'

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const letter = url.searchParams.get('letter')

    assertValid(
      !!letter && /^[A-Za-z]$/.test(letter),
      'Valid letter parameter is required',
      { letter, field: 'letter' }
    )

    const houses = await getHousesByLetter(letter!.toUpperCase())

    return Response.json({
      success: true,
      houses,
      count: houses.length
    })
  },
  {
    context: { api: 'houses-by-letter', route: 'api/houses-by-letter' }
  }
)

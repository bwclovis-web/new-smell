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
    const { ErrorHandler } = await import('~/utils/errorHandling')
    const appError = ErrorHandler.handle(error, { api: 'houses-by-letter', letter })
    return Response.json({
      success: false,
      message: appError.userMessage,
      houses: []
    }, { status: 500 })
  }
}

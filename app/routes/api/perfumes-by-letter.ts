import type { LoaderFunctionArgs } from 'react-router'

import { getPerfumesByLetterPaginated } from '~/models/perfume.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const letter = url.searchParams.get('letter')
  const skip = parseInt(url.searchParams.get('skip') || '0', 10)
  const take = parseInt(url.searchParams.get('take') || '12', 10)

  if (!letter || !/^[A-Za-z]$/.test(letter)) {
    return Response.json({
      success: false,
      message: 'Valid letter parameter is required',
      perfumes: []
    }, { status: 400 })
  }

  try {
    const perfumes = await getPerfumesByLetterPaginated(letter.toUpperCase(), { skip, take })

    return Response.json({
      success: true,
      perfumes: perfumes.perfumes,
      count: perfumes.count,
      meta: {
        letter,
        skip,
        take,
        hasMore: perfumes.perfumes.length === take,
        totalCount: perfumes.count
      }
    })
  } catch (error) {
    console.error('Error fetching perfumes by letter:', error)
    return Response.json({
      success: false,
      message: 'Failed to fetch perfumes',
      perfumes: []
    }, { status: 500 })
  }
}

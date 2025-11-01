import type { LoaderFunctionArgs } from 'react-router'

import { getPerfumesByLetterPaginated } from '~/models/perfume.server'
import { assertValid, withLoaderErrorHandling } from '~/utils/errorHandling.patterns'

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const letter = url.searchParams.get('letter')
    const skip = parseInt(url.searchParams.get('skip') || '0', 10)
    const take = parseInt(url.searchParams.get('take') || '12', 10)

    assertValid(
      !!letter && /^[A-Za-z]$/.test(letter),
      'Valid letter parameter is required',
      { letter, field: 'letter' }
    )

    const perfumes = await getPerfumesByLetterPaginated(letter!.toUpperCase(), { skip, take })

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
  },
  {
    context: { api: 'perfumes-by-letter', route: 'api/perfumes-by-letter' }
  }
)

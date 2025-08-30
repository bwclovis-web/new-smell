import type { LoaderFunctionArgs } from 'react-router'

import { getAllPerfumes } from '~/models/perfume.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const letter = url.searchParams.get('letter')

  if (!letter) {
    return Response.json({
      success: false,
      message: 'Letter parameter is required',
      perfumes: []
    }, { status: 400 })
  }

  try {
    const allPerfumes = await getAllPerfumes()

    // Filter perfumes by the first letter of their name
    const filteredPerfumes = allPerfumes.filter(perfume =>
      perfume.name.charAt(0).toUpperCase() === letter.toUpperCase()
    )

    return Response.json({
      success: true,
      perfumes: filteredPerfumes,
      meta: {
        letter,
        totalCount: filteredPerfumes.length
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

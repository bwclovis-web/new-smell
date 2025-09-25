import { getAvailablePerfumesForDecanting } from '~/models/perfume.server'

export async function loader() {
  try {
    const availablePerfumes = await getAvailablePerfumesForDecanting()

    return Response.json({
      success: true,
      perfumes: availablePerfumes,
      count: availablePerfumes.length
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minute cache
        'X-Data-Size': JSON.stringify(availablePerfumes).length.toString()
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching available perfumes for decanting:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch available perfumes',
      perfumes: []
    }, { status: 500 })
  }
}

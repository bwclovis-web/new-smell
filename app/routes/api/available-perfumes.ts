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
    const { ErrorHandler } = await import('~/utils/errorHandling')
    const appError = ErrorHandler.handle(error, { api: 'available-perfumes' })
    return Response.json({
      success: false,
      error: appError.userMessage,
      perfumes: []
    }, { status: 500 })
  }
}

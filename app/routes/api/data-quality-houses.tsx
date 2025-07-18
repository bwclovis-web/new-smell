import { getAllHouses } from '~/models/house.server'

export async function loader() {
  try {
    const houses = await getAllHouses()
    return Response.json({
      success: true,
      houses,
      count: houses.length
    })
  } catch (error) {
    console.error('Error fetching perfume houses:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch perfume houses',
      houses: []
    }, { status: 500 })
  }
}

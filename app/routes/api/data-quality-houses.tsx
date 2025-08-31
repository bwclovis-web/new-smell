import { getAllHouses } from '~/models/house.server'

export async function loader() {
  const houses = await getAllHouses({ selectFields: true, take: 1000 }) // Limit to 1000 houses and only essential fields
  return houses
}

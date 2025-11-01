import { getAllHouses } from "~/models/house.server"

export async function loader() {
  // Get all houses with all fields needed for CSV export
  const houses = await getAllHouses({ take: 1000 }) // Include all fields for CSV export
  return houses
}

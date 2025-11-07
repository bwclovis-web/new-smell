import type { LoaderFunctionArgs } from "react-router"

import { searchPerfumeHouseByName } from "~/models/house.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const name = url.searchParams.get("name")
  if (!name) {
    return Response.json([])
  }
  // Explicitly include houses without perfumes
  const result = await searchPerfumeHouseByName(name, true)
  return Response.json(result ? result : [])
}

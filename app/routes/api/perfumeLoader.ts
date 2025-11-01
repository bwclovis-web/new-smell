import type { LoaderFunctionArgs } from "react-router"

import { searchPerfumeByName } from "~/models/perfume.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const name = url.searchParams.get("name")
  if (!name) {
    return []
  }
  const result = await searchPerfumeByName(name)
  return result ? result : []
}

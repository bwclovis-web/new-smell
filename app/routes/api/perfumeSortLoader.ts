import type { LoaderFunctionArgs } from "react-router"

import { getAllPerfumesWithOptions } from "~/models/perfume.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const sortBy = url.searchParams.get("sortBy")

  const options = {
    sortBy: sortBy as
      | "name-asc"
      | "name-desc"
      | "created-desc"
      | "created-asc"
      | "type-asc"
      | undefined,
  }

  const result = await getAllPerfumesWithOptions(options)
  return result || []
}

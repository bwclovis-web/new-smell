import type { LoaderFunctionArgs } from 'react-router'

import { deletePerfume } from '~/models/perfume.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return []
  }
  const result = await deletePerfume(id)
  return result ? result : []
}

import type { LoaderFunctionArgs } from 'react-router'

import { createTag } from '~/models/tags.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const tag = url.searchParams.get('tag')
  if (!tag) {
    return []
  }
  const result = await createTag(tag)
  return result ? result : []
}

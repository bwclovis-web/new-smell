import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import { getUserById } from '~/models/user.server'
import { parseCookies, verifyJwt } from '../../api/utils'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get cookies from the request
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies({ headers: { cookie: cookieHeader } })
  let user = null
  if (cookies.token) {
    const payload = verifyJwt(cookies.token)
    if (payload && payload.userId) {
      user = await getUserById(payload.userId)
    }
  }
  return { user }
}

const RootLayout = () => {
  const { user } = useLoaderData<typeof loader>()
  return (
    <div className="flex flex-col gap-8 items-center min-h-full bg-noir-light  px-4 relative h-full">
      <GlobalNavigation user={user} />
      <main className="w-full md:w-3/4 h-full">
        <Outlet
          context={{ user }}
        />
      </main>
    </div>
  )
}

export default RootLayout

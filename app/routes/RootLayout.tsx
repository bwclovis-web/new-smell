import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import { getUserById } from '~/models/user.server'
import { createSafeUser, type SafeUser } from '~/types'
import { parseCookies, verifyJwt } from '../../api/utils'
import background from '../images/bg-scent.webp'
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get cookies from the request
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies({ headers: { cookie: cookieHeader } })
  let user = null
  if (cookies.token) {
    const payload = verifyJwt(cookies.token)
    if (payload && payload.userId) {
      const fullUser = await getUserById(payload.userId)
      user = createSafeUser(fullUser)
    }
  }
  return { user }
}

const RootLayout = () => {
  const { user } = useLoaderData<typeof loader>()
  return (
    <div className="flex flex-col gap-8 items-center min-h-full bg-noir-light  px-4 relative h-full">
      <img src={background} alt="" className="absolute object-cover w-full h-full top-0 left-0 z-10 opacity-5" />
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

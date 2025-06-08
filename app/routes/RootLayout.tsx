import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router'
import { Suspense } from 'react'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import { getUserById } from '~/models/user.server'
import { createSafeUser, type SafeUser } from '~/types'
import { parseCookies, verifyJwt } from '@api/utils'
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
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex flex-col gap-8 items-center  bg-noir-light px-4 relative min-h-svh">
        <img
          src={background}
          alt=""
          className="absolute object-cover w-full min-h-screen top-0 left-0 z-0 opacity-5"
        />
        <GlobalNavigation user={user} />
        <main className="w-full md:w-3/4 min-h-screen">
          <Outlet
            context={{ user }}
          />
        </main>
      </div>
    </Suspense>
  )
}

export default RootLayout

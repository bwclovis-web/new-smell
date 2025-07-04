import { parseCookies, verifyJwt } from '@api/utils'
import { Suspense } from 'react'
import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import { getUserById } from '~/models/user.server'
import { createSafeUser } from '~/types'

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
      <div className="flex bg-noir-gold dark:bg-noir-black flex-col gap-8 items-center px-4 relative min-h-svh">
        <img
          src={background}
          alt=""
          className="absolute object-cover w-full min-h-screen top-0 left-0 z-0 dark:invert-25 opacity-10 mask-b-from-80% mask-b-to-100% mask-b-linear"
        />
        <GlobalNavigation user={user} />
        <main className="w-full md:w-3/4 min-h-screen relative z-10">
          <Outlet
            context={{ user }}
          />
        </main>
      </div>
    </Suspense>
  )
}

export default RootLayout

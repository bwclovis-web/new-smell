import { parseCookies, verifyJwt } from '@api/utils'
import { Suspense } from 'react'
import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import { getUserById } from '~/models/user.server'
import { createSafeUser } from '~/types'
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
      <div className="flex flex-col gap-8 items-center relative min-h-svh bg-noir-black">
        <GlobalNavigation user={user} />
        <main className="w-full min-h-screen relative z-10 top-0">
          <Outlet
            context={{ user }}
          />
        </main>
      </div>
    </Suspense>
  )
}

export default RootLayout

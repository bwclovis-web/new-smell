import cookie from 'cookie'
import { Suspense } from 'react'
import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import MobileBottomNavigation from '~/components/Molecules/MobileBottomNavigation/MobileBottomNavigation'
import MobileNavigation from '~/components/Molecules/MobileNavigation/MobileNavigation'
// Performance monitoring only in development
import { DevPerformanceLoader } from '~/components/Performance'
import { getUserById } from '~/models/user.server'
import { createSafeUser } from '~/types'
import { verifyAccessToken } from '~/utils/security/session-manager.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get cookies from the request
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = cookie.parse(cookieHeader)

  let user = null

  // Try access token first
  let accessToken = cookies.accessToken

  // Fallback to legacy token for backward compatibility
  if (!accessToken && cookies.token) {
    accessToken = cookies.token
  }

  if (accessToken) {
    const payload = verifyAccessToken(accessToken)

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
        <MobileNavigation user={user} />
        <MobileBottomNavigation user={user} />
        <main className="w-full min-h-screen relative mb-28">
          <Outlet
            context={{ user }}
          />
        </main>
        <DevPerformanceLoader />
      </div>
    </Suspense>
  )
}

export default RootLayout

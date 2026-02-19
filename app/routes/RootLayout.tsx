import { Suspense } from "react"
import { type LoaderFunctionArgs, Outlet, useLoaderData } from "react-router"
import AdminNavigation from "~/components/Molecules/AdminNavigation/AdminNavigation"

import GlobalNavigation from "~/components/Molecules/GlobalNavigation/GlobalNavigation"
import MobileBottomNavigation from "~/components/Molecules/MobileBottomNavigation/MobileBottomNavigation"
import MobileNavigation from "~/components/Molecules/MobileNavigation/MobileNavigation"
// Performance monitoring only in development
// import { DevPerformanceLoader } from '~/components/Performance'
import { getSessionFromRequest } from "~/utils/session-from-request.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSessionFromRequest(request, { includeUser: true })
  const user = session?.user ?? null
  return { user }
}

const RootLayout = () => {
  const { user } = useLoaderData<typeof loader>()

  return (
    <Suspense fallback={<div className="min-h-svh flex items-center justify-center text-noir-gold/60">Loading...</div>}>
      <div
        className="flex flex-col gap-8 items-center relative min-h-svh bg-noir-black"
        suppressHydrationWarning
      >
        <GlobalNavigation user={user} />
        <MobileNavigation user={user} />
        <MobileBottomNavigation user={user} />
        <main className="w-full min-h-screen relative mb-28 md:mb-0">
          <Outlet context={{ user }} />
        </main>
        {/* <DevPerformanceLoader /> */}
      </div>
    </Suspense>
  )
}

export default RootLayout

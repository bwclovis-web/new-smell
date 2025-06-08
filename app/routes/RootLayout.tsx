import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router'
import { Suspense } from 'react'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import { sharedLoader } from '~/utils/sharedLoader'
import background from '../images/bg-scent.webp'
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await sharedLoader(request)
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

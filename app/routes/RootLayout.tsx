import { type LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'
import { getUserById } from '~/models/user.server'

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = context?.userSession?.userId
    ? await getUserById(context.userSession.userId)
    : null

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

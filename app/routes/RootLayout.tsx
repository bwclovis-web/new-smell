import { Outlet } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'

const RootLayout = () => (
  <div className="flex flex-col gap-8 items-center min-h-full bg-noir-light  px-4 relative h-full">
    <GlobalNavigation />
    <main className="w-full md:w-3/4 h-full">
      <Outlet />
    </main>
  </div>
)

export default RootLayout

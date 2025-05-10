import { Outlet } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'

const RootLayout = () => (
  <div className="flex flex-col gap-8 items-center h-full bg-noir-light  px-4 relative">
    <GlobalNavigation />
    <main className="w-3/4 h-screen">
      <Outlet />
    </main>
  </div>
)

export default RootLayout

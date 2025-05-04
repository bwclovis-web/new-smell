import { Outlet } from 'react-router'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'

const RootLayout = () => (
  <div className="flex flex-col gap-8 items-center h-full bg-purple-900 px-4 relative">
    <GlobalNavigation />
    <main className="w-3/4">
      <Outlet />
    </main>
  </div>
)

export default RootLayout

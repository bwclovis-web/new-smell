import { Outlet } from 'react-router'

import AdminNavigation from '~/components/Molecules/AdminNavigation/AdminNavigation'

const AdminLayout = () => (
  <div className="flex flex-col md:flex-row w-full gap-4 md:gap-10 items-start">
    <AdminNavigation />
    <div className="flex-1 p-4 w-full">
      <Outlet />
    </div>
  </div>
)
export default AdminLayout

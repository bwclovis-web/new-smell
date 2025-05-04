import { Outlet } from 'react-router'

import AdminNavigation from '~/components/Molecules/AdminNavigation/AdminNavigation'

const AdminLayout = () => (
  <div className="flex w-full gap-10 items-start">
    <AdminNavigation />
    <div className="flex-1 p-4">
      <Outlet />
      {/* This is where the child routes will be rendered */}
    </div>
  </div>
)
export default AdminLayout

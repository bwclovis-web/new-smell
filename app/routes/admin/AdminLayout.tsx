import { Outlet, useOutletContext } from 'react-router'

import AdminNavigation from '~/components/Molecules/AdminNavigation/AdminNavigation'
const AdminLayout = () => {
  const { user } = useOutletContext<{ user: any }>()
  return (
    <div className="flex flex-col md:flex-row w-full gap-4 md:gap-10 items-start relative z-10">
      {user.role === 'admin' && <AdminNavigation />}
      <div className="flex-1 p-4 w-full">
        <Outlet
          context={{ user }}
        />
      </div>
    </div>
  );
}
export default AdminLayout

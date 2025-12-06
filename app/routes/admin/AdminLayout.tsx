import { Outlet, useLoaderData } from "react-router"

import AdminNavigation from "~/components/Molecules/AdminNavigation/AdminNavigation"
import { createError } from "~/utils/errorHandling"
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { requireAdmin } from "~/utils/requireAdmin.server"

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    const user = await requireAdmin(request)
    return { user }
  },
  {
    context: { page: "admin-layout" },
    redirectOnAuth: "/sign-in?redirect=/admin",
    redirectOnAuthz: "/unauthorized",
  }
)

const AdminLayout = () => {
  const { user } = useLoaderData<typeof loader>()

  return (
    <div className="relative flex flex-col md:flex-row w-full gap-4 md:gap-10 items-start z-10">
      {user && <div className="hidden md:block"><AdminNavigation user={user} /></div>}
      <div className="flex-1  w-full">
        
        <Outlet context={{ user }} />
      </div>
      {!user && (
        <div className="bg-noir-light/40 backdrop-blur-sm rounded-md shadow-md p-6 border border-noir-dark">
          <h1 className="text-2xl font-bold mb-4">Welcome, Guest!</h1>
        </div>
      )}
    </div>
  )
}

export default AdminLayout

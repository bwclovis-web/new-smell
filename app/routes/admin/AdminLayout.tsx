import { Outlet, useLoaderData } from "react-router"

import AdminNavigation from "~/components/Molecules/AdminNavigation/AdminNavigation"
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { sharedLoader } from "~/utils/sharedLoader"

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    // Allow all authenticated users to access admin layout
    // Navigation will show different links based on role
    const user = await sharedLoader(request)
    return { user }
  },
  {
    context: { page: "admin-layout" },
    redirectOnAuth: "/sign-in?redirect=/admin",
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

import { useLoaderData } from "react-router"

import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { sharedLoader } from "~/utils/sharedLoader"

export const ROUTE_PATH = "/admin"

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    // Allow all authenticated users to access admin index
    const user = await sharedLoader(request)
    return { user }
  },
  {
    context: { page: "admin-index" },
    redirectOnAuth: "/sign-in?redirect=/admin",
  }
)

const AdminIndex = () => {
  const { user } = useLoaderData<typeof loader>()
  const isAdmin = user?.role === "admin"
  
  return (
    <div>
      <h1>{isAdmin ? "Admin Panel" : "My Account"}</h1>
      <p>Welcome{user ? `, ${user.email}` : ""}!</p>
      {!isAdmin && (
        <p className="mt-4 text-sm text-noir-gold-500">
          Use the navigation menu to access your wishlist, scents, and account settings.
        </p>
      )}
    </div>
  )
}

export default AdminIndex

import { useLoaderData } from "react-router"

import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { requireAdmin } from "~/utils/requireAdmin.server"

export const ROUTE_PATH = "/admin"

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    const user = await requireAdmin(request)
    return { user }
  },
  {
    context: { page: "admin-index" },
    redirectOnAuth: "/sign-in?redirect=/admin",
    redirectOnAuthz: "/unauthorized",
  }
)

const AdminIndex = () => {
  const { user } = useLoaderData<typeof loader>()
  return (
    <div>
      <h1>Admin Index</h1>
      <p>Welcome to the admin panel, {user.email}!</p>
    </div>
  )
}

export default AdminIndex

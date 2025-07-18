import { useLoaderData } from 'react-router'

import DataQualityDashboard from '~/components/Organisms/DataQualityDashboard/DataQualityDashboard'
import { sharedLoader } from '~/utils/sharedLoader'
export const ROUTE_PATH = '/admin/data-quality' as const
// Ensure only admin users can access this route
export const loader = async ({ request }: { request: Request }) => {
  const user = await sharedLoader(request)

  // Here you could add additional admin-only check
  // if you have a role system in your app

  return { user }
}

export default function DataQualityPage() {
  const { user } = useLoaderData<typeof loader>()

  // Only show dashboard if user is admin
  const isAdmin = user?.role === 'admin' || user?.isAdmin

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Quality Dashboard</h1>
      <DataQualityDashboard user={user} isAdmin={isAdmin} />
    </div>
  )
}

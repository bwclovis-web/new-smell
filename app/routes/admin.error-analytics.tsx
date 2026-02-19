/**
 * Error Analytics Dashboard Page
 *
 * Admin page for viewing error analytics and insights.
 */

export const ROUTE_PATH = "/admin/error-analytics"

import { lazy, Suspense } from "react"
import { type LoaderFunctionArgs, useLoaderData } from "react-router"

// Lazy-load dashboard to defer chart.js until admin error-analytics route
const ErrorAnalyticsDashboard = lazy(() =>
  import("~/components/Organisms/ErrorAnalyticsDashboard/ErrorAnalyticsDashboard").then(m => ({
    default: m.ErrorAnalyticsDashboard,
  }))
)
import { errorAnalytics } from "~/utils/errorAnalytics.server"
import { createError } from "~/utils/errorHandling"
import { withLoaderErrorHandling } from "~/utils/server/errorHandling.server"
import { sharedLoader } from "~/utils/sharedLoader"

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    // Check authentication and authorization
    const user = await sharedLoader(request)

    if (!user) {
      throw createError.authentication("Authentication required")
    }

    if (user.role !== "admin") {
      throw createError.authorization("Admin access required")
    }

    // Generate initial analytics report
    const report = errorAnalytics.generateReport({ timeRange: "day" })

    return {
      report,
      user,
    }
  },
  {
    context: { page: "error-analytics-dashboard" },
    redirectOnAuth: "/sign-in?redirect=/admin/error-analytics",
    redirectOnAuthz: "/unauthorized",
  }
)

export default function ErrorAnalyticsPage() {
  const { report } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded-lg m-4" />}>
        <ErrorAnalyticsDashboard initialData={report} />
      </Suspense>
    </div>
  )
}

import { lazy, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { useLoaderData } from "react-router"

// Lazy-load dashboard to defer chart.js (~150KB) until admin data-quality route
const DataQualityDashboard = lazy(
  () => import("~/components/Containers/DataQualityDashboard")
)
import TitleBanner from "~/components/Organisms/TitleBanner"
import banner from "~/images/quality.webp"
import { withLoaderErrorHandling } from "~/utils/server/errorHandling.server"
import { requireAdmin } from "~/utils/requireAdmin.server"

export const ROUTE_PATH = "/admin/data-quality" as const

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    const user = await requireAdmin(request)
    return { user }
  },
  {
    context: { page: "data-quality" },
    redirectOnAuth: "/sign-in?redirect=/admin/data-quality",
    redirectOnAuthz: "/unauthorized",
  }
)

export default function DataQualityPage() {
  const { user } = useLoaderData<typeof loader>()
  const isAdmin = user?.role === "admin" || user?.isAdmin
  const { t } = useTranslation()
  return (
    <>
      <TitleBanner
        image={banner}
        heading={t("dataQuality.heading")}
        subheading={t("dataQuality.subheading")}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="animate-pulse h-64 bg-noir-dark/30 rounded-lg" />}>
          <DataQualityDashboard user={user} isAdmin={isAdmin} />
        </Suspense>
      </div>
    </>
  )
}

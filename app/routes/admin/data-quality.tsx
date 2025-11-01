import { useTranslation } from "react-i18next"
import { useLoaderData } from "react-router"

import DataQualityDashboard from "~/components/Containers/DataQualityDashboard"
import TitleBanner from "~/components/Organisms/TitleBanner"
import banner from "~/images/quality.webp"
import { sharedLoader } from "~/utils/sharedLoader"
export const ROUTE_PATH = "/admin/data-quality" as const

export const loader = async ({ request }: { request: Request }) => {
  const user = await sharedLoader(request)
  return { user }
}

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
        <DataQualityDashboard user={user} isAdmin={isAdmin} />
      </div>
    </>
  )
}

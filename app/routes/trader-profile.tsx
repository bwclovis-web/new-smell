import { useTranslation } from "react-i18next"
import { type LoaderFunctionArgs, useLoaderData } from "react-router"

import VooDooDetails from "~/components/Atoms/VooDooDetails"
import {
  ItemsSearchingFor,
  ItemsToTrade,
} from "~/components/Containers/TraderProfile"
import TraderFeedbackSection from "~/components/Containers/TraderProfile/TraderFeedbackSection"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { useTrader } from "~/hooks/useTrader"
import { getTraderById } from "~/models/user.server"
import { authenticateUser } from "~/utils/auth.server"
import { getTraderDisplayName } from "~/utils/user"

import banner from "../images/trade.webp"

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (!params.id) {
    throw new Error("Note ID is required")
  }
  const trader = await getTraderById(params.id)
  if (!trader) {
    throw new Error("Trader not found")
  }
  const auth = await authenticateUser(request)
  const viewer = auth.success
    ? {
        id: auth.user.id,
        firstName: auth.user.firstName,
        lastName: auth.user.lastName,
        username: auth.user.username,
        role: auth.user.role,
      }
    : null
  return { trader, viewer }
}

const TraderProfilePage = () => {
  const loaderData = useLoaderData<typeof loader>()
  const { trader: initialTrader, viewer } = loaderData
  
  // Hydrate trader query with loader data
  const { data: trader } = useTrader(initialTrader.id, initialTrader)
  
  const { t } = useTranslation()
  
  if (!trader) {
    return <div className="p-4">Trader not found</div>
  }
  
  const traderName = getTraderDisplayName(trader)

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("traderProfile.heading", { traderName })}
        subheading={t("traderProfile.subheading", { traderName })}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 inner-container items-start p-6">
      <div className="md:col-span-2 xl:col-span-1">
        <TraderFeedbackSection
          traderId={trader.id}
          viewerId={viewer?.id}
        />
      </div>
        <div className="noir-border relative col-span-1 p-4">
          <h2>{t("traderProfile.itemsAvailable")}</h2>
          <VooDooDetails
            type="primary"
            name="itemsAvailable"
            summary={t("traderProfile.itemsAvailableSummary", { traderName })}
            background="dark"
            defaultOpen={true}
          >
          {trader.UserPerfume.length > 0 ? (
            <ul className="mt-6">
              {trader.UserPerfume.map((userPerfume: any) => (
                <ItemsToTrade key={userPerfume.id} userPerfume={userPerfume} />
              ))}
            </ul>
          ) : (
            <p>{t("traderProfile.noItemsAvailable")}</p>
          )}
          </VooDooDetails>
        </div>
        <div className="noir-border relative col-span-1 w-full p-4">
        <h2>{t("traderProfile.itemsSearchingFor")}</h2>
        <VooDooDetails
          type="primary"
          name="itemsSearchingFor"
          summary={t("traderProfile.itemsSummary", { traderName })}
          background="dark"
          defaultOpen={true}
        >
          <ItemsSearchingFor
            wishlistItems={(trader.UserPerfumeWishlist || []).map((item: any) => ({
              ...item,
              user: trader,
            }))}
          />
        </VooDooDetails>
         
        </div>
      </div>
      
    </section>
  )
}

export default TraderProfilePage

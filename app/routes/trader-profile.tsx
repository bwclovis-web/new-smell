import { useTranslation } from "react-i18next"
import { type LoaderFunctionArgs, useLoaderData } from "react-router"

import {
  ItemsSearchingFor,
  ItemsToTrade,
} from "~/components/Containers/TraderProfile"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { useTrader } from "~/hooks/useTrader"
import { getTraderById } from "~/models/user.server"
import { getTraderDisplayName } from "~/utils/user"

import banner from "../images/trade.webp"

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) {
    throw new Error("Note ID is required")
  }
  const trader = await getTraderById(params.id)
  if (!trader) {
    throw new Error("Trader not found")
  }
  return { trader }
}

const TraderProfilePage = () => {
  const loaderData = useLoaderData<typeof loader>()
  const { trader: initialTrader } = loaderData
  
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
      <div className="flex flex-col md:flex-row justify-between inner-container items-start gap-8 p-6">
        <div className="noir-border relative md:w-1/2 w-full p-4">
          <h2>{t("traderProfile.itemsAvailable")}</h2>
          {trader.UserPerfume.length > 0 ? (
            <ul className="mt-6">
              {trader.UserPerfume.map((userPerfume: any) => (
                <ItemsToTrade key={userPerfume.id} userPerfume={userPerfume} />
              ))}
            </ul>
          ) : (
            <p>{t("traderProfile.noItemsAvailable")}</p>
          )}
        </div>
        <div className="noir-border relative md:w-1/2 w-full p-4">
          <h2>{t("traderProfile.itemsSearchingFor")}</h2>
          <ItemsSearchingFor
            wishlistItems={(trader.UserPerfumeWishlist || []).map((item: any) => ({
              ...item,
              user: trader,
            }))}
          />
        </div>
      </div>
    </section>
  )
}

export default TraderProfilePage

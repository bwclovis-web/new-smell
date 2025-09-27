import { useTranslation } from "react-i18next"
import { type LoaderFunctionArgs, useLoaderData } from "react-router"

import { ItemsToTrade, ItemsSearchingFor } from "~/components/Containers/TraderProfile"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { getTraderById } from "~/models/user.server"
import { getTraderDisplayName } from "~/utils/user"

import banner from '../images/trade.webp'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) {
    throw new Error('Note ID is required')
  }
  const trader = await getTraderById(params.id)
  if (!trader) {
    throw new Error('Trader not found')
  }
  return { trader }
}

const TraderProfilePage = () => {
  const { trader } = useLoaderData<typeof loader>()
  const { t } = useTranslation()
  const traderName = getTraderDisplayName(trader)

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("traderProfile.heading", { traderName })}
        subheading={t("traderProfile.subheading", { traderName })}
      />
      <div className="flex flex-col md:flex-row justify-between inner-container items-start gap-8 p-6">
        <div className="noir-border relative w-1/2 p-4">
          <h2>{t("traderProfile.itemsAvailable")}</h2>
          {trader.UserPerfume.length > 0 ? (
            <ul className="mt-6">
              {trader.UserPerfume.map((userPerfume: any) => (
                <ItemsToTrade
                  key={userPerfume.id}
                  userPerfume={userPerfume}
                />
              ))}
            </ul>
          ) : (
            <p>{t("traderProfile.noItemsAvailable")}</p>
          )}
        </div>
        <div className="noir-border relative w-1/2 p-4">
          <h2>{t("traderProfile.itemsSearchingFor")}</h2>
          <ItemsSearchingFor
            wishlistItems={
              (trader.UserPerfumeWishlist || []).map((item: any) => ({
                ...item,
                user: trader,
              }))
            }
          />
        </div>
      </div>
    </section>
  )
}

export default TraderProfilePage

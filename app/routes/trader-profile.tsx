import { useTranslation } from "react-i18next"
import { type LoaderFunctionArgs, useLoaderData } from "react-router"

import TitleBanner from "~/components/Organisms/TitleBanner/TitleBanner"
import { getTraderById } from "~/models/user.server"
import { getTraderDisplayName } from "~/utils/user"

import banner from '../images/traderBoth.webp'

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

  console.log('Trader Profile Page', trader)

  return (
    <section>
      <TitleBanner
        imagePos="object-top"
        image={banner}
        heading={t("traderProfile.heading", { traderName })}
        subheading={t("traderProfile.subheading", { traderName })}
      />
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 p-6">
        <div className="noir-outline w-1/2 p-4">
          <h2>Items Available</h2>
          {trader.UserPerfume.length > 0 ? (
            <ul>
              {trader.UserPerfume.map((userPerfume: any) => {
                console.log('User Perfume', userPerfume)
                return (
                  <li key={userPerfume.id} className="mb-2">
                    {/* <span className="font-semibold">{userPerfume.perfume.name}</span> - {userPerfume.available}ml */}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p>No items available for trading.</p>
          )}
        </div>
        <div className="noir-outline w-1/2 p-4">
          <h2>Items Searching For</h2>
        </div>
      </div>
    </section>
  )
}

export default TraderProfilePage

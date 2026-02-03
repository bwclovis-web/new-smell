import { useTranslation } from "react-i18next"
import { type LoaderFunctionArgs, type MetaFunction, useLoaderData } from "react-router"

import VooDooDetails from "~/components/Atoms/VooDooDetails"
import {
  ItemsSearchingFor,
  ItemsToTrade,
} from "~/components/Containers/TraderProfile"
import ContactTraderButton from "~/components/Containers/TraderProfile/ContactTraderButton"
import TraderFeedbackSection from "~/components/Containers/TraderProfile/TraderFeedbackSection"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { useMediaQuery } from "~/hooks/useMediaQuery"
import { useTrader } from "~/hooks/useTrader"
import type { TraderFeedbackResponse } from "~/lib/queries/traderFeedback"
import {
  getTraderFeedbackByReviewer,
  getTraderFeedbackList,
  getTraderFeedbackSummary,
} from "~/models/traderFeedback.server"
import { getTraderById } from "~/models/user.server"
import { authenticateUser } from "~/utils/auth.server"
import { getTraderDisplayName } from "~/utils/user"

import banner from "../images/trade.webp"

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("traderProfile.meta.title") },
    { name: "description", content: t("traderProfile.meta.description") },
  ]
}

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
  const viewerId = viewer?.id ?? null

  const [summary, comments, viewerFeedbackRecord] = await Promise.all([
    getTraderFeedbackSummary(trader.id),
    getTraderFeedbackList(trader.id),
    viewerId && viewerId !== trader.id
      ? getTraderFeedbackByReviewer(trader.id, viewerId)
      : Promise.resolve(null),
  ])

  const feedback: TraderFeedbackResponse = {
    summary,
    comments,
    viewerFeedback: viewerFeedbackRecord
      ? {
          traderId: viewerFeedbackRecord.traderId,
          reviewerId: viewerFeedbackRecord.reviewerId,
          rating: viewerFeedbackRecord.rating,
          comment: viewerFeedbackRecord.comment,
          createdAt: viewerFeedbackRecord.createdAt.toISOString(),
          updatedAt: viewerFeedbackRecord.updatedAt.toISOString(),
        }
      : null,
  }

  return { trader, viewer, feedback }
}

const TraderProfilePage = () => {
  const loaderData = useLoaderData<typeof loader>()
  const { trader: initialTrader, viewer, feedback } = loaderData
  const { data: trader } = useTrader(initialTrader.id, initialTrader)
  const { t } = useTranslation()
  // Details open on tablet/desktop (md+), closed on mobile
  const detailsOpenByDefault = useMediaQuery("(min-width: 768px)")
  
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
          initialData={feedback}
        />
        {/* Contact Trader Button */}
        <div className="mt-4">
          <ContactTraderButton
            traderId={trader.id}
            trader={trader}
            viewerId={viewer?.id}
          />
        </div>
      </div>
        <div className="noir-border relative col-span-1 p-4">
          <h2 className="text-center mb-2">{t("traderProfile.itemsAvailable")}</h2>
          <VooDooDetails
            type="primary"
            name="itemsAvailable"
            summary={t("traderProfile.itemsAvailableSummary", { traderName })}
            background="dark"
            defaultOpen={detailsOpenByDefault}
          >
          {trader.UserPerfume.length > 0 ? (
            <ul className="mt-6">
              {trader.UserPerfume.map((userPerfume: any) => (
                <ItemsToTrade
                  key={userPerfume.id}
                  userPerfume={userPerfume}
                  trader={trader}
                  viewerId={viewer?.id}
                />
              ))}
            </ul>
          ) : (
            <p>{t("traderProfile.noItemsAvailable")}</p>
          )}
          </VooDooDetails>
        </div>
        <div className="noir-border relative col-span-1 w-full p-4">
        <h2 className="text-center mb-2">{t("traderProfile.itemsSearchingFor")}</h2>
        <VooDooDetails
          type="primary"
          name="itemsSearchingFor"
          summary={t("traderProfile.itemsSummary", { traderName })}
          background="dark"
          defaultOpen={detailsOpenByDefault}
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

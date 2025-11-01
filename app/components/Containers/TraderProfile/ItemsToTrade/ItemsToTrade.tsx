import { useTranslation } from "react-i18next"
import { GiTrade } from "react-icons/gi"

import VooDooDetails from "~/components/Atoms/VooDooDetails"
import type { UserPerfumeI } from "~/types"

import TradersComments from "./TradersComments"

const getTradeLabel = (preference: string) => {
  const { t } = useTranslation()
  switch (preference) {
    case "cash":
      return t("traderProfile.preferences.cash")
    case "trade":
      return t("traderProfile.preferences.trade")
    case "both":
      return t("traderProfile.preferences.both")
    default:
      return t("traderProfile.preferences.cash")
  }
}

// Header component for perfume info
const PerfumeHeader = ({ userPerfume }: { userPerfume: UserPerfumeI }) => (
  <>
    <div className="font-semibold text-xl text-noir-gold">
      {userPerfume.perfume?.name || "Unknown Perfume"}
    </div>
    <div className="text-sm text-noir-gold-100">
      by {userPerfume.perfume?.perfumeHouse?.name}
    </div>
  </>
)

const PriceInfo = ({ userPerfume }: { userPerfume: UserPerfumeI }) => {
  const { t } = useTranslation()
  return (
    <p className="text-md text-noir-gold-100 mt-4">
      {t("traderProfile.amount")}:{" "}
      <span className="text-noir-gold-500">{userPerfume.available || "0"}ml</span>
    </p>
  )
}

// Helper component for trade information
const TradeInfo = ({ userPerfume }: { userPerfume: UserPerfumeI }) => {
  const { t } = useTranslation()
  return (
    <div className="text-sm text-noir-gold-300 space-y-1">
      {userPerfume.tradePrice && (
        <p className="font-medium text-noir-gold-100">
          {t("traderProfile.tradePrice")}:
          <span className="text-noir-gold-500"> ${userPerfume.tradePrice}/ml</span>
        </p>
      )}
      <p className="text-noir-gold-100">
        {t("traderProfile.preference")}:
        <span className="text-noir-gold-500">
          {" "}
          {getTradeLabel(userPerfume.tradePreference || "cash")}
        </span>
      </p>
      {userPerfume.tradeOnly && (
        <div className="text-gold-noir font-medium flex gap-2 items-center">
          <GiTrade size={20} className="fill-noir-gold-100" />{" "}
          <span className="text-noir-gold-500">{t("traderProfile.tradeOnly")}</span>
        </div>
      )}
    </div>
  )
}

// Comments component
const CommentsSection = ({ userPerfume }: { userPerfume: UserPerfumeI }) => {
  const { t } = useTranslation()
  const publicComments =
    userPerfume?.comments?.filter((comment) => comment.isPublic) || []

  return (
    <>
      {publicComments.length > 0 ? (
        <VooDooDetails
          summary={`${t("traderProfile.comments")} (${publicComments.length})`}
          className="text-noir-gold mt-2"
        >
          <TradersComments comments={publicComments} />
        </VooDooDetails>
      ) : (
        <div className="mt-2 text-xs text-noir-gold-500 italic">
          {t(
            "traderProfile.noPublicComments",
            "No public comments available for this item."
          )}
        </div>
      )}
    </>
  )
}

const ItemsToTrade = ({ userPerfume }: { userPerfume: UserPerfumeI }) => (
  <li
    key={userPerfume.id}
    className="mb-4 border bg-noir-gold/20 border-noir-gold rounded p-2"
  >
    <PerfumeHeader userPerfume={userPerfume} />
    <PriceInfo userPerfume={userPerfume} />
    <TradeInfo userPerfume={userPerfume} />
    <CommentsSection userPerfume={userPerfume} />
  </li>
)

export default ItemsToTrade

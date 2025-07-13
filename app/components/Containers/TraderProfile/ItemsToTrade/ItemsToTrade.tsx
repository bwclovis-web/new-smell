import VooDooDetails from "~/components/Atoms/VooDooDetails/VooDooDetails"
import type { UserPerfumeI } from "~/types"

import TradersComments from "./TradersComments"

// Helper function to get trade preference label
const getTradeLabel = (preference: string) => {
  switch (preference) {
    case 'cash': return 'Cash Only'
    case 'trade': return 'Trade Only'
    case 'both': return 'Cash or Trade'
    default: return 'Cash Only'
  }
}

// Header component for perfume info
const PerfumeHeader = ({ userPerfume }: { userPerfume: UserPerfumeI }) => (
  <>
    <div className="font-semibold text-xl text-noir-gold">{userPerfume.perfume?.name || 'Unknown Perfume'}</div>
    <div className="text-sm text-noir-gold-100">by {userPerfume.perfume?.perfumeHouse?.name}</div>
  </>
)

// Price and availability component
const PriceInfo = ({ userPerfume }: { userPerfume: UserPerfumeI }) => (
  <div className="text-md text-noir-gold-500 mt-1">
    Available: {userPerfume.available || '0'}ml
    {userPerfume.price && (
      <span className="ml-2">• Price: ${userPerfume.price}</span>
    )}
  </div>
)

// Helper component for trade information
const TradeInfo = ({ userPerfume }: { userPerfume: UserPerfumeI }) => (
  <div className="text-sm text-noir-gold-300 mt-2 space-y-1">
    {userPerfume.tradePrice && (
      <div className="font-medium">Trade Price: ${userPerfume.tradePrice}/ml</div>
    )}
    <div>Preference: {getTradeLabel(userPerfume.tradePreference || 'cash')}</div>
    {userPerfume.tradeOnly && (
      <div className="text-amber-300 font-medium">🔄 Trade Only Item</div>
    )}
  </div>
)

// Comments component
const CommentsSection = ({ userPerfume }: { userPerfume: UserPerfumeI }) => (
  <>
    {(userPerfume?.comments?.length || 0) > 0 && (
      <VooDooDetails summary="Traders Comments" className="text-noir-gold mt-2">
        <TradersComments comments={userPerfume.comments} />
      </VooDooDetails>
    )}
  </>
)

const ItemsToTrade = ({ userPerfume }: { userPerfume: UserPerfumeI }) => (
  <li key={userPerfume.id} className="mb-4 border bg-noir-gold/20 border-noir-gold rounded p-2">
    <PerfumeHeader userPerfume={userPerfume} />
    <PriceInfo userPerfume={userPerfume} />
    <TradeInfo userPerfume={userPerfume} />
    <CommentsSection userPerfume={userPerfume} />
  </li>
)

export default ItemsToTrade

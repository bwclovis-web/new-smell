import VooDooDetails from "~/components/Atoms/VooDooDetails"
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
  <p className="text-md text-noir-gold-100 mt-4">
    Available: <span className="text-noir-gold-500">{userPerfume.available || '0'}ml</span>
  </p>
)

// Helper component for trade information
const TradeInfo = ({ userPerfume }: { userPerfume: UserPerfumeI }) => (
  <div className="text-sm text-noir-gold-300 space-y-1">
    {userPerfume.tradePrice && (
      <p className="font-medium text-noir-gold-100">Trade Price:
        <span className="text-noir-gold-500"> ${userPerfume.tradePrice}/ml</span>
      </p>
    )}
    <p className="text-noir-gold-100">Preference:
      <span className="text-noir-gold-500"> {getTradeLabel(userPerfume.tradePreference || 'cash')}</span>
    </p>
    {userPerfume.tradeOnly && (
      <div className="text-gold-noir font-medium">🔄 Trade Only Item</div>
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

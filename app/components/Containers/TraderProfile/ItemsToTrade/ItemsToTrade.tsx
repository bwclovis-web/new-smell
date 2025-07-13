import VooDooDetails from "~/components/Atoms/VooDooDetails/VooDooDetails"

import TradersComments from "./TradersComments"

const ItemsToTrade = ({ userPerfume }) => (
  <li key={userPerfume.id} className="mb-4 border bg-noir-gold/20 border-noir-gold rounded p-2">
    <div className="font-semibold text-xl text-noir-gold">{userPerfume.perfume?.name || 'Unknown Perfume'}</div>
    <div className="text-sm text-noir-gold-100">by {userPerfume.perfume.perfumeHouse.name}</div>
    <div className="text-md text-noir-gold-500 mt-1">
      Available: {userPerfume.available || '0'}ml
      {userPerfume.price && (
        <span className="ml-2">• Price: ${userPerfume.price}</span>
      )}
    </div>

    {userPerfume?.comments?.length > 0 && (
      <VooDooDetails summary="Traders Comments" className="text-noir-gold mt-2">
        <TradersComments comments={userPerfume.comments} />
      </VooDooDetails>
    )}
  </li>
)

export default ItemsToTrade

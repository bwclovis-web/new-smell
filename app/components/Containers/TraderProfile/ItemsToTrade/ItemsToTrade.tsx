import VooDooDetails from "~/components/Atoms/VooDooDetails/VooDooDetails"

import TradersComments from "./TradersComments"

const ItemsToTrade = ({ userPerfume }) => (
  <li key={userPerfume.id} className="mb-4 bg-noir-light rounded p-2">
    <div className="font-semibold text-lg">{userPerfume.perfume?.name || 'Unknown Perfume'}</div>
    <div className="text-sm text-gray-500">by {userPerfume.perfume.perfumeHouse.name}</div>
    <div className="text-sm text-gray-600 mt-1">
      Available: {userPerfume.available || '0'}ml
      {userPerfume.price && (
        <span className="ml-2">• Price: ${userPerfume.price}</span>
      )}
    </div>

    {userPerfume?.comments?.length > 0 && (
      <VooDooDetails summary="Traders Comments">
        <TradersComments comments={userPerfume.comments} />
      </VooDooDetails>
    )}
  </li>
)

export default ItemsToTrade

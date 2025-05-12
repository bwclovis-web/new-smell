import { NavLink } from 'react-router'

import { ROUTE_PATH as PERFUME_PATH } from '~/routes/perfume'
import { ROUTE_PATH as PERFUME_HOUSE } from '~/routes/perfume-house'
const LinkCard = ({ data, type }) => {
  const url = type === 'house' ? PERFUME_HOUSE : PERFUME_PATH

  return (
    <NavLink
      viewTransition
      to={`${url}/${data.name}`}
      className=" p-4 flex justify-between items-center gap-4 noir-outline"
    >
      <img
        src={data.image}
        alt={data.name}
        className="w-58 h-50 object-cover mb-2 min-w-1/2"
      />
      <div className="w-1/2">
        <h2 className="text-2xl font-semibold">{data.name}</h2>
        <p className="text-sm text-gray-500 max-w-[175ch] text-ellipsis overflow-hidden  line-clamp-4">{data.description}</p>
      </div>
    </NavLink>
  )
}

export default LinkCard

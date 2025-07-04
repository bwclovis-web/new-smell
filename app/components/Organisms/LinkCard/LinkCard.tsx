import { NavLink } from 'react-router'

import { ROUTE_PATH as PERFUME_PATH } from '~/routes/perfume'
import { ROUTE_PATH as PERFUME_HOUSE } from '~/routes/perfume-house'
const LinkCard = ({ data, type }) => {
  const url = type === 'house' ? PERFUME_HOUSE : PERFUME_PATH

  return (
    <NavLink
      viewTransition
      to={`${url}/${data.name}`}
      className="p-4 flex justify-between items-center gap-4 noir-outline relative"
    >
      <img
        src={data.image}
        alt={data.name}
        className="w-58 h-50 object-cover mb-2 min-w-1/2 rounded-lg dark:brightness-85"
        style={{
          viewTransitionName: `perfume-image-${data.id}`,
          contain: 'layout style paint'
        }}
      />
      <div className="w-1/2">
        <h2 className="text-2xl font-semibold text-wrap break-words text-noir-dark dark:text-noir-white">{data.name}</h2>
        <p className="text-sm text-noir-black max-w-[175ch] text-ellipsis overflow-hidden line-clamp-4 dark:text-noir-light">{data.description}</p>
        {data.type && (
          <p className="text-sm absolute bottom-2 right-2 bg-noir-gold dark:bg-noir-gold/80 border rounded-sm text-noir-black px-2 py-1 capitalize font-bold border-noir-dark">
            {data.type}
          </p>
        )}
      </div>
    </NavLink>
  )
}

export default LinkCard

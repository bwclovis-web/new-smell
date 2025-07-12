import { NavLink } from 'react-router'

import { ROUTE_PATH as PERFUME_PATH } from '~/routes/perfume'
import { ROUTE_PATH as PERFUME_HOUSE } from '~/routes/perfume-house'
const LinkCard = ({ data, type }) => {
  const url = type === 'house' ? PERFUME_HOUSE : PERFUME_PATH

  return (
    <NavLink
      viewTransition
      to={`${url}/${data.name}`}
      className="p-4 flex flex-col overflow-hidden justify-between items-center relative group
      border-4 border-double border-noir-gold h-full transition-all duration-300 ease-in-out
      before:content-[''] before:absolute before:w-3 before:h-3 before:border-2 before:border-noir-gold before:top-0 before:left-0 before:border-r-0 before:border-b-0
      after:content-[''] after:absolute after:w-3 after:h-3 after:border-2 after:border-noir-gold after:bottom-0 after:right-0 after:border-l-0 after:border-t-0"
    >
      <div className='text-center'>
        <h2 className="text-noir-gold font-semibold text-wrap break-words">{data.name}</h2>
        {data?.perfumeHouse?.name && <p className='text-md font-semibold text-noir-gold'>{data.perfumeHouse.name}</p>}
        {data.type && (
          <p className="text-sm absolute bottom-2 right-2 bg-noir-gold dark:bg-noir-gold/80 border rounded-sm text-noir-black px-2 py-1 capitalize font-bold border-noir-dark">
            {data.type}
          </p>
        )}
      </div>
      <div className="relative w-100 h-100 min-w-1/2 rounded-lg ">
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover mask-radial-at-center mask-radial-from-10% mask-radial-to-75%
          transition-all duration-500 ease-in-out scale-120
          filter grayscale-100 group-hover:grayscale-0 group-hover:scale-100 group-hover:mask-radial-from-30% group-hover:mask-radial-to-100%"
          style={{
            viewTransitionName: `perfume-image-${data.id}`,
            contain: 'layout style paint'
          }}
        />
      </div>

    </NavLink>
  )
}

export default LinkCard

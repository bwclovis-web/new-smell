import { NavLink } from 'react-router'

import { ROUTE_PATH as PERFUME_PATH } from '~/routes/perfume'
import { ROUTE_PATH as PERFUME_HOUSE } from '~/routes/perfume-house'
const LinkCard = ({ data, type, children }: { data: any; type: any; children?: any }) => {
  const url = type === 'house' ? PERFUME_HOUSE : PERFUME_PATH

  return (
    <div className='relative w-full h-full group noir-border overflow-hidden transition-all duration-300 ease-in-out'>
      <NavLink
        viewTransition
        to={`${url}/${data.name}`}
        className="p-4 flex flex-col overflow-hidden justify-between items-center group h-full transition-all duration-300 ease-in-out"
      >
        <div className='text-center'>
          <h2 className="text-wrap break-words">{data.name}</h2>
          {data?.perfumeHouse?.name && <p className='text-md font-semibold text-noir-gold-100'>{data.perfumeHouse.name}</p>}
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
      {children && (
        <div className="absolute bottom-0 left-0 right-0 bg-noir-dark/80 p-2 border-t border-noir-gold">
          {children}
        </div>
      )}
    </div>
  )
}

export default LinkCard

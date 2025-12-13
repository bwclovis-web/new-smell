import { NavLink } from "react-router"

import { OptimizedImage } from "~/components/Atoms/OptimizedImage"
import { ROUTE_PATH as PERFUME_PATH } from "~/routes/perfume"
import { ROUTE_PATH as PERFUME_HOUSE } from "~/routes/perfume-house"

interface LinkCardProps {
  data: {
    id: string
    name: string
    slug: string
    image?: string
    type?: string
    perfumeHouse?: {
      name: string
    }
  }
  type: "house" | "perfume"
  children?: React.ReactNode
  selectedLetter?: string | null
  sourcePage?: string
}

// React Compiler automatically optimizes this component - no manual memo needed
function LinkCard({
  data,
  type,
  children,
  selectedLetter,
  sourcePage,
}: LinkCardProps) {
  const url = type === "house" ? PERFUME_HOUSE : PERFUME_PATH
  return (
    <div className="relative w-full h-full group noir-border overflow-hidden transition-all duration-300 ease-in-out bg-noir-dark/70 backdrop-blur-sm">
      <NavLink
        to={`${url}/${data.slug}`}
        state={selectedLetter ? { selectedLetter, sourcePage } : { sourcePage }}
        viewTransition
        prefetch="intent"
        className="p-4 flex flex-col overflow-hidden justify-between items-center group  transition-all duration-300 ease-in-out "
      >
        <div className="text-center">
          <h2 className="text-wrap break-words">{data.name}</h2>
          {data?.perfumeHouse?.name && (
            <p className="text-md font-semibold text-noir-gold-100">
              {data.perfumeHouse.name}
            </p>
          )}
          {data.type && (
            <p className="text-sm absolute bottom-2 right-2 bg-noir-gold dark:bg-noir-gold/80 border rounded-sm text-noir-black px-2 py-1 capitalize font-bold border-noir-dark">
              {data.type}
            </p>
          )}
        </div>
        <div className="relative rounded-lg">
          {data.image ? (
            <OptimizedImage
              src={data.image}
              alt={data.name}
              width={300}
              height={400}
              priority={false}
              quality={75}
              className="w-full object-cover mask-radial-at-center mask-radial-from-10% mask-radial-to-75%                                                        
            transition-all duration-500 ease-in-out scale-120 h-full aspect-square
            filter grayscale-100 group-hover:grayscale-0 group-hover:scale-100 group-hover:mask-radial-from-30% group-hover:mask-radial-to-100%"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              viewTransitionName={`perfume-image-${data.id}`}
              placeholder="blur"
            />
          ) : (
            <div className="w-full h-48 bg-noir-dark/50 flex items-center justify-center border border-noir-gold/20 rounded-lg">
              <span className="text-noir-gold/40 text-sm">No Image</span>
            </div>
          )}
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

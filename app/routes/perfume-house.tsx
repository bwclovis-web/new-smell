
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { GrEdit } from 'react-icons/gr'
import { MdDeleteForever } from 'react-icons/md'
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  NavLink,
  useLoaderData,
  useNavigate
} from 'react-router'
import { useOutletContext } from 'react-router-dom'

import PerfumeHouseAddressBlock from '~/components/Containers/PerfumeHouse/AddressBlock/PerfumeHouseAddressBlock'
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll'
import { getPerfumeHouseByName } from '~/models/house.server'

import { ROUTE_PATH as ALL_HOUSES } from './behind-the-bottle'

// Simple loader - get house with only first 9 perfumes
export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.houseId) {
    throw new Error('House ID is required')
  }
  const perfumeHouse =
    await getPerfumeHouseByName(params.houseId, { skip: 0, take: 9 })
  if (!perfumeHouse) {
    throw new Response('House not found', { status: 404 })
  }
  return { perfumeHouse }
}

// Meta data
export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('singleHouse.meta.title') },
    { name: 'description', content: t('singleHouse.meta.description') }
  ]
}

export const ROUTE_PATH = '/perfume-house'

// Types
type OutletContextType = {
  user?: {
    role?: string
  }
}

// Main component
const HouseDetailPage = () => {
  const { perfumeHouse } = useLoaderData<typeof loader>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const {
    perfumes,
    loading,
    hasMore,
    observerRef,
    loadMorePerfumes
  } = useInfiniteScroll({
    houseName: perfumeHouse.name,
    initialPerfumes: perfumeHouse.perfumes || [],
    scrollContainerRef
  })

  // Handle delete house
  const handleDelete = async () => {
    const url = `/api/deleteHouse?id=${perfumeHouse.id}`
    const res = await fetch(url)
    if (res.ok) {
      navigate(ALL_HOUSES)
    }
  }

  console.log('perfumeHouse', perfumeHouse)
  return (
    <section className='relative z-10 my-4'>
      <header className="flex items-end justify-center mb-10 relative h-[600px]">
        <img
          src={perfumeHouse.image || ''}
          alt={perfumeHouse.name}
          loading="lazy"
          width={300}
          height={600}
          className="w-full h-full object-cover mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 details-title filter contrast-[1.4] brightness-[0.9] sepia-[0.2] mix-blend-screen mask-linear-gradient-to-b"
          style={{
            viewTransitionName: `perfume-image-${perfumeHouse.id}`,
            contain: 'layout style paint'
          }}
        />

        <div className='relative z-10 px-8 text-center filter w-full rounded-lg py-4 text-shadow-lg text-shadow-noir-black/90'>
          <h1>{perfumeHouse.name}</h1>
        </div>
      </header>

      <div className="flex flex-col gap-20 mx-auto max-w-6xl">
        <div className="noir-border relative bg-white/5 text-noir-gold-500">
          <PerfumeHouseAddressBlock perfumeHouse={perfumeHouse} />
          <p className='p-4 mb-4'>{perfumeHouse.description}</p>
          <span className="tag absolute">{perfumeHouse.type}</span>
        </div>
        {perfumes.length > 0 && (
          <div
            ref={scrollContainerRef}
            className=" rounded-b-lg max-h-[800px] overflow-y-auto w-full relative overflow-x-hidden style-scroll"
          >
            <h2 className="text-center mb-4">Perfumes</h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 p-2 pb-4">
              {perfumes.map((perfume: any) => (
                <li key={perfume.id}>
                  <NavLink
                    viewTransition
                    to={`/perfume/${perfume.name}`}
                    className="block p-2 h-full noir-border relative w-full transition-colors duration-300 ease-in-out"
                  >
                    <h3 className="
                      text-center block text-lg tracking-wide py-2
                      font-semibold text-noir-gold  leading-6"
                    >
                      {perfume.name}
                    </h3>
                    <img
                      src={perfume.image ?? undefined}
                      alt={perfume.name}
                      className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto details-title dark:brightness-90"
                      style={{
                        viewTransitionName: `perfume-image-${perfume.id}`,
                        contain: 'layout style paint'
                      }}
                    />

                  </NavLink>
                </li>
              ))}
            </ul>
            <div
              ref={observerRef}
              aria-live="polite"
              aria-busy={loading}
              role="status"
              className="sticky bottom-0 w-full bg-gradient-to-t from-noir-black to-transparent flex flex-col items-center justify-center py-4"
            >
              {loading && <span>Loading more perfumes…</span>}
              {!loading && hasMore && (
                <button
                  onClick={loadMorePerfumes}
                  className="bg-noir-gray text-noir-light px-4 py-2 rounded-md font-semibold hover:bg-noir-dark transition-all"
                >
                  Load More Perfumes
                </button>
              )}
              {!hasMore && <span>No more perfumes to load.</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default HouseDetailPage

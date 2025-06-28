import React, { useRef } from 'react'
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

import { ROUTE_PATH as ALL_HOUSES } from './all-houses'

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
  const context = useOutletContext<OutletContextType>()
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

  return (
    <section className='relative z-10'>
      <header className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1>{perfumeHouse.name}</h1>
          <div className="flex gap-2 items-center justify-between">
            <p className="text-xl text-shadow-noir-gold/20 text-shadow-sm font-black tracking-wide">
              <span>Founded:</span>
              {' '}
              <span className='italic'>{perfumeHouse.founded}</span>
            </p>
          </div>
        </div>
        {context?.user?.role === 'admin' && (
          <div className="flex gap-4 items-center">
            <button
              onClick={handleDelete}
              aria-label={`delete ${perfumeHouse.name}`}
              className="bg-red-600/60 hover:bg-red-600/90 rounded-full p-2 cursor-pointer border-2 border-red-600/60 hover:border-red-600/90 transition-all duration-300 ease-in-out"
            >
              <MdDeleteForever size={40} fill="white" />
            </button>
            <NavLink
              aria-label={`edit ${perfumeHouse.name}`}
              viewTransition
              to={`/admin/perfume-house/${perfumeHouse.name}/edit`}
              className="bg-blue-600/60 p-3 hover:bg-blue-600/90 text-white rounded-full flex items-center justify-center border-2 border-blue-600/60 hover:border-blue-600 transition-all duration-300 ease-in-out"
            >
              <GrEdit size={32} fill="white" />
            </NavLink>
          </div>
        )}
      </header>

      <div className="flex gap-20 flex-col md:flex-row items-start justify-between">
        <div className="md:w-1/2 noir-outline rounded-b-lg relative">
          <img
            src={perfumeHouse.image ?? undefined}
            alt=""
            className="w-full h-58 object-cover mb-2 rounded-t-lg"
          />
          <div className="px-6">
            <p>{perfumeHouse.description}</p>
            <PerfumeHouseAddressBlock perfumeHouse={perfumeHouse} />
            <span className="tag absolute">{perfumeHouse.type}</span>
          </div>
        </div>
        {perfumes.length > 0 && (
          <div
            ref={scrollContainerRef}
            className="md:w-1/2 rounded-b-lg max-h-[800px] overflow-y-auto w-full relative overflow-x-hidden"
          >
            <h2 className="text-2xl font-bold mb-4">Perfumes</h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 p-2">
              {perfumes.map((perfume: any) => (
                <li key={perfume.id}>
                  <NavLink
                    viewTransition
                    to={`/perfume/${perfume.name}`}
                    className="block p-2 h-full noir-outline hover:bg-gray-100 w-full transition-colors duration-300 ease-in-out"
                  >
                    <img
                      src={perfume.image ?? undefined}
                      alt={perfume.name}
                      className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto details-title"
                      style={{
                        viewTransitionName: `perfume-image-${perfume.id}`,
                        contain: 'layout style paint'
                      }}
                    />
                    <span className="
                      text-center block text-lg tracking-wide py-2
                      font-semibold text-noir-light bg-noir-gray rounded-md leading-6"
                    >
                      {perfume.name}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>            <div
              ref={observerRef}
              aria-live="polite"
              aria-busy={loading}
              role="status"
              className="sticky bottom-0 w-full bg-gradient-to-t from-noir-light to-transparent flex flex-col items-center justify-center py-4"
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


import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { GrEdit } from 'react-icons/gr'
import { MdDeleteForever } from 'react-icons/md'
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  NavLink,
  useLoaderData,
  useLocation,
  useNavigate
} from 'react-router'
import { useOutletContext } from 'react-router-dom'

import { Button, VooDooLink } from '~/components/Atoms/Button/Button'
import PerfumeHouseAddressBlock from '~/components/Containers/PerfumeHouse/AddressBlock/PerfumeHouseAddressBlock'
import { useInfiniteScroll } from '~/hooks/useInfiniteScroll'
import { getPerfumeHouseBySlug } from '~/models/house.server'

import { ROUTE_PATH as ALL_HOUSES } from './behind-the-bottle'
const BEHIND_THE_BOTTLE = '/behind-the-bottle'
export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.houseSlug) {
    throw new Error('House slug is required')
  }
  const perfumeHouse =
    await getPerfumeHouseBySlug(params.houseSlug, { skip: 0, take: 9 })
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
  const { user } = useOutletContext<OutletContextType>()
  const navigate = useNavigate()
  const location = useLocation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Get selectedLetter from navigation state
  const selectedLetter = (location.state as { selectedLetter?: string })
    ?.selectedLetter
  const {
    perfumes,
    loading,
    hasMore,
    observerRef,
    loadMorePerfumes
  } = useInfiniteScroll({
    houseSlug: perfumeHouse.slug,
    initialPerfumes: (perfumeHouse.perfumes || []) as any,
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
    <section className='relative z-10 my-4'>
      {/* Back Button */}


      <header className="flex items-end justify-center mb-10 relative h-[600px]">
        <img
          src={perfumeHouse.image || ''}
          alt={perfumeHouse.name}
          // height={600}
          // width={300}
          className="w-full h-full object-cover mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 details-title filter contrast-[1.4] brightness-[0.9] sepia-[0.2] mix-blend-screen mask-linear-gradient-to-b"
          style={{
            viewTransitionName: `perfume-image-${perfumeHouse.id}`,
            contain: 'layout style paint'
          }}
        />

        <div className='relative z-10 px-8 text-center filter w-full rounded-lg py-4 text-shadow-lg text-shadow-noir-black/90'>
          <h1 className='text-noir-gold'>{perfumeHouse.name}</h1>
        </div>
      </header>

      <div className="flex flex-col gap-20 mx-auto max-w-6xl">
        {user?.role === 'admin'
          && (
            <div>
              <h3 className='text-lg font-semibold text-center text-noir-gold-500 mb-2'>Admin</h3>
              <div className='flex flex-col items-center justify-between gap-2'>
                <VooDooLink
                  aria-label={`edit ${perfumeHouse.name}`}
                  variant="icon"
                  background={'gold'}
                  size={'sm'}
                  className='flex items-center justify-between gap-2'
                  url={`/admin/perfume-house/${perfumeHouse.slug}/edit`}
                >
                  <span>Edit Perfume</span>
                  <GrEdit size={22} />
                </VooDooLink>
                <Button
                  onClick={() => handleDelete()}
                  aria-label={`delete ${perfumeHouse.name}`}
                  variant="icon"
                  className='flex items-center justify-between gap-2'
                  background={'gold'}
                  size={'sm'}
                >
                  <span>Delete Perfume</span>
                  <MdDeleteForever size={22} />
                </Button>
              </div>
            </div>
          )
        }
        <div className="noir-border relative bg-white/5 text-noir-gold-500">

          <PerfumeHouseAddressBlock perfumeHouse={perfumeHouse} />
          <p className='p-4 mb-8'>{perfumeHouse.description}</p>
          <span className="tag absolute">{perfumeHouse.type}</span>
          <button
            onClick={() => navigate(BEHIND_THE_BOTTLE, {
              state: selectedLetter ? { selectedLetter } : {}
            })}
            className="absolute bottom-2 left-4 z-20 bg-noir-gold/90 hover:bg-noir-gold text-noir-black px-2 cursor-pointer rounded-md font-semibold transition-all duration-300 ease-in-out shadow-lg"
            aria-label={selectedLetter ? `Back to houses starting with ${selectedLetter}` : 'Back to houses'}
          >
            ← Back to {selectedLetter || 'Houses'}
          </button>

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
                    to={`/perfume/${perfume.slug}`}
                    state={selectedLetter ? { selectedLetter } : {}}
                    className="block p-2 h-full noir-border relative w-full transition-colors duration-300 ease-in-out"
                  >
                    <h3 className="
                      text-center block text-lg tracking-wide py-2
                      font-semibold text-noir-gold  leading-6 capitalize"
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

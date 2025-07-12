/* eslint-disable max-statements */
import { parseCookies, verifyJwt } from '@api/utils'
import { useTranslation } from 'react-i18next'
import { type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData, useNavigate } from 'react-router'
import { useOutletContext } from 'react-router-dom'

import PerfumeIcons from '~/components/Containers/Perfume/PerfumeIcons/PerfumeIcons'
import PerfumeNotes from '~/components/Containers/Perfume/PerfumeNotes/PerfumeNotes'
import { getPerfumeByName } from '~/models/perfume.server'
import { isInWishlist } from '~/models/wishlist.server'

import { ROUTE_PATH as ALL_PERFUMES } from './all-perfumes'
import { ROUTE_PATH as HOUSE_PATH } from './perfume-house'
export const ROUTE_PATH = '/perfume'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (!params.id) {
    throw new Error('Note ID is required')
  }
  const perfume = await getPerfumeByName(params.id)
  if (!perfume) {
    throw new Response('House not found', { status: 404 })
  }

  // Check if user is logged in and if perfume is in their wishlist
  let isInUserWishlist = false
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = parseCookies({ headers: { cookie: cookieHeader } })

    if (cookies.token) {
      const payload = verifyJwt(cookies.token)
      if (payload && payload.userId) {
        isInUserWishlist = await isInWishlist(payload.userId, perfume.id)
      }
    }
  } catch {
    // User not authenticated, just continue
  }

  return { perfume, isInUserWishlist }
}

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('singlePerfume.meta.title') },
    { name: 'description', content: t('singlePerfume.meta.description') }
  ]
}

const PerfumePage = () => {
  const { perfume, isInUserWishlist } = useLoaderData<typeof loader>()
  type OutletContextType = { user: { role: string, id: string } | null }
  const { user } = useOutletContext<OutletContextType>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const handleDelete = async () => {
    const url = `/api/deletePerfume?id=${perfume.id}`
    const res = await fetch(url)
    if (res.ok) {
      navigate(ALL_PERFUMES)
    } else {
      console.error('Failed to delete the house')
    }
  }

  return (
    <section className="relative z-10">
      <header className="flex items-center bg-noir-dark/60 justify-start mb-10 relative py-40 ">
        <img
          src={perfume.image || ''}
          alt={perfume.name}
          loading="lazy"
          width={300}
          height={300}
          className="w-full h-full object-cover mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 details-title dark:brightness-90"
          style={{
            viewTransitionName: `perfume-image-${perfume.id}`,
            contain: 'layout style paint'
          }}
        />
        <div className='relative z-10 w-full max-w-max px-8 backdrop-blur-sm bg-noir-dark/20 rounded-lg py-4 text-noir-light text-shadow-md text-shadow-noir-dark'>
          <h1>{perfume.name}</h1>
          <p className='text-lg tracking-wide mt-2'>
            {t('singlePerfume.subheading')}
            <NavLink
              className="text-blue-200 hover:underline font-semibold underline"
              viewTransition
              to={`${HOUSE_PATH}/${perfume?.perfumeHouse?.name}`}
            >
              {perfume?.perfumeHouse?.name}
            </NavLink>
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-20">
        <div className="md:w-1/3 noir-outline rounded-b-lg">
          <div className="p-6">
            <p className='mb-3'>{perfume.description}</p>
            <PerfumeNotes
              perfumeNotesOpen={perfume.perfumeNotesOpen}
              perfumeNotesHeart={perfume.perfumeNotesHeart}
              perfumeNotesClose={perfume.perfumeNotesClose}
            />
            {user && (
              <PerfumeIcons
                perfume={perfume}
                handleDelete={handleDelete}
                userRole={user.role}
                isInWishlist={isInUserWishlist}
              />
            )}
          </div>
        </div>
        <div className="w-1/2">
          <h2>Perfume Notes</h2>
        </div>
      </div>
    </section>
  )
}

export default PerfumePage

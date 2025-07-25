import { parseCookies, verifyJwt } from '@api/utils'
import { useTranslation } from 'react-i18next'
import { type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData, useNavigate } from 'react-router'
import { useOutletContext } from 'react-router-dom'

import PerfumeIcons from '~/components/Containers/Perfume/PerfumeIcons/PerfumeIcons'
import PerfumeNotes from '~/components/Containers/Perfume/PerfumeNotes/PerfumeNotes'
import PerfumeRatingSystem from '~/components/Containers/Perfume/PerfumeRatingSystem/PerfumeRatingSystem'
import { getPerfumeByName } from '~/models/perfume.server'
import { getPerfumeRatings, getUserPerfumeRating } from '~/models/perfumeRating.server'
import { isInWishlist } from '~/models/wishlist.server'

import { ROUTE_PATH as HOUSE_PATH } from './perfume-house'
import { ROUTE_PATH as ALL_PERFUMES } from './the-vault'
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
  const isInUserWishlist = await checkWishlistStatus(request, perfume.id)

  // Get user's current ratings and community averages
  const [userRatings, ratingsData] = await Promise.all([
    getUserRatingsForPerfume(request, perfume.id),
    getPerfumeRatings(perfume.id)
  ])

  return {
    perfume,
    isInUserWishlist,
    userRatings,
    averageRatings: ratingsData.averageRatings
  }
}

const getUserIdFromRequest = async (request: Request): Promise<string | null> => {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = parseCookies({ headers: { cookie: cookieHeader } })

    if (!cookies.token) {
      return null
    }

    const payload = verifyJwt(cookies.token)
    return payload?.userId || null
  } catch {
    return null
  }
}

const getUserRatingsForPerfume = async (request: Request, perfumeId: string) => {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return null
  }

  try {
    return await getUserPerfumeRating(userId, perfumeId)
  } catch {
    return null
  }
}

const checkWishlistStatus = async (request: Request, perfumeId: string) => {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return false
  }

  try {
    return await isInWishlist(userId, perfumeId)
  } catch {
    return false
  }
}

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('singlePerfume.meta.title') },
    { name: 'description', content: t('singlePerfume.meta.description') }
  ]
}

const PerfumePage = () => {
  const {
    perfume,
    isInUserWishlist,
    userRatings,
    averageRatings
  } = useLoaderData<typeof loader>()
  type OutletContextType = { user: { role: string, id: string } | null }
  const { user } = useOutletContext<OutletContextType>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleDelete = async () => {
    const url = `/api/deletePerfume?id=${perfume.id}`
    const res = await fetch(url)
    if (res.ok) {
      navigate(ALL_PERFUMES)
    }
  }

  if (!perfume) {
    return <div className="p-4">Perfume not found</div>
  }

  return (
    <section className="relative z-10 min-h-screen">
      <PerfumeHeader perfume={perfume} t={t} />
      <PerfumeContent
        perfume={perfume}
        user={user}
        isInUserWishlist={isInUserWishlist}
        userRatings={userRatings}
        averageRatings={averageRatings}
        handleDelete={handleDelete}
      />
    </section>
  )
}

const PerfumeHeader = ({
  perfume,
  t
}: {
  perfume: any
  t: any
}) => (
  <header className="flex items-end justify-center mb-10 relative h-[600px]">
    <img
      src={perfume.image || ''}
      alt={perfume.name}
      loading="lazy"
      width={300}
      height={600}
      className="w-full h-full object-cover mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 details-title filter contrast-[1.4] brightness-[0.9] sepia-[0.2] mix-blend-screen mask-linear-gradient-to-b"
      style={{
        viewTransitionName: `perfume-image-${perfume.id}`,
        contain: 'layout style paint'
      }}
    />
    <div className='relative z-10 px-8 text-center filter w-full rounded-lg py-4 text-shadow-lg text-shadow-noir-black/90'>
      <h1 className='text-noir-gold'>{perfume.name}</h1>
      <p className='text-lg tracking-wide mt-2 text-noir-gold-500'>
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
)

const PerfumeContent = ({
  perfume,
  user,
  isInUserWishlist,
  userRatings,
  averageRatings,
  handleDelete
}: {
  perfume: any
  user: any
  isInUserWishlist: boolean
  userRatings: any
  averageRatings: any
  handleDelete: () => void
}) => (
  <div className="flex flex-col gap-20 mx-auto inner-container items-center">
    <div className="w-full flex gap-4 max-w-6xl">
      {user && (
        <PerfumeIcons
          perfume={perfume}
          handleDelete={handleDelete}
          userRole={user.role}
          isInWishlist={isInUserWishlist}
        />
      )}
      <div className='bg-white/5 w-3/4 border-4 noir-border relative shadow-lg text-noir-gold-500'>
        <PerfumeNotes
          perfumeNotesOpen={perfume.perfumeNotesOpen}
          perfumeNotesHeart={perfume.perfumeNotesHeart}
          perfumeNotesClose={perfume.perfumeNotesClose}
        />
        <p className='p-4'>{perfume.description}</p>
      </div>
    </div>
    <div className="w-full flex gap-4 items-start justify-center">
      <aside className='noir-border relative'>
        <PerfumeRatingSystem
          perfumeId={perfume.id}
          userId={user?.id || 'anonymous'}
          userRatings={userRatings}
          averageRatings={averageRatings}
        />
      </aside>
      <div className='noir-border relative w-2/3'>
        <h2>Reviews</h2>
      </div>
    </div>
  </div>
)

export default PerfumePage

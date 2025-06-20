import { parseCookies, verifyJwt } from '@api/utils'
import { useTranslation } from 'react-i18next'
import { type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData, useNavigate } from 'react-router'
import { useOutletContext } from 'react-router-dom'

import PerfumeIcons from '~/components/Containers/Perfume/PerfumeIcons/PerfumeIcons'
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
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1>{perfume.name}</h1>
          <p>
            By:
            {' '}
            <NavLink
              className="text-blue-800 hover:underline font-semibold"
              viewTransition
              to={`${HOUSE_PATH}/${perfume?.perfumeHouse?.name}`}
            >
              {perfume?.perfumeHouse?.name}
            </NavLink>
          </p>
        </div>
        {' '}
        {user && (
          <PerfumeIcons
            perfume={perfume}
            handleDelete={handleDelete}
            userRole={user.role}
            isInWishlist={isInUserWishlist}
          />
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-20">
        <div className="md:w-1/3 noir-outline rounded-b-lg">
          {' '}
          <img
            src={perfume.image || ''}
            alt={perfume.name}
            className="w-full h-68 object-cover mb-2 rounded-t-lg"
          />
          <div className="px-6 py-2">
            <p>{perfume.description}</p>
            <div className="border py-2 rounded-md bg-noir-dark text-noir-light px-2 my-6">
              <div className="flex items-center gap-2">
                <span>Opening Notes:</span>
                <ul className="flex gap-2">
                  {perfume.perfumeNotesOpen.map((note, idx) => (
                    <li className="font-semibold capitalize" key={note.id}>
                      {note.name}
                      {idx + 1 < perfume.perfumeNotesOpen.length && <span>,</span>}
                    </li>

                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <span>Mid Notes:</span>
                <ul className="flex gap-2">
                  {perfume.perfumeNotesHeart.map((note, idx) => (
                    <li className="font-semibold capitalize" key={note.id}>
                      {note.name}
                      {idx + 1 < perfume.perfumeNotesHeart.length && <span>,</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <span>End Notes:</span>
                <ul className="font-semibold capitalize">
                  {perfume.perfumeNotesClose.map((note, idx) => (
                    <li key={note.id}>
                      {note.name}
                      {idx + 1 < perfume.perfumeNotesClose.length && <span>,</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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

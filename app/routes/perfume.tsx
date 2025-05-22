import { useTranslation } from 'react-i18next'
import { GrEdit } from 'react-icons/gr'
import { MdDeleteForever } from 'react-icons/md'
import { type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData, useNavigate } from 'react-router'

import { getPerfumeByName } from '~/models/perfume.server'

import { ROUTE_PATH as ALL_PERFUMES } from './all-perfumes'
import { ROUTE_PATH as HOUSE_PATH } from './perfume-house'
export const ROUTE_PATH = '/perfume'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) {
    throw new Error('Note ID is required')
  }
  const perfume = await getPerfumeByName(params.id)
  if (!perfume) {
    throw new Response('House not found', { status: 404 })
  }
  return { perfume }
}

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('singlePerfume.title') },
    { name: 'description', content: t('singlePerfume.description') }
  ]
}

const PerfumePage = () => {
  const { perfume } = useLoaderData<typeof loader>()
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
    <section>
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

        <div className="flex gap-4 items-center">
          <button onClick={() => handleDelete()} aria-label={`delete ${perfume.name}`} className="bg-red-600/60 hover:bg-red-600/90 rounded-full p-2 cursor-pointer border-2 border-red-600/60 hover:border-red-600/90 transition-all duration-300 ease-in-out">
            <MdDeleteForever size={40} fill="white" />
          </button>
          <NavLink
            aria-label={`edit ${perfume.name}`}
            viewTransition
            to={`/admin/perfume-house/${perfume.name}/edit`}
            className="bg-blue-600/60 p-3 hover:bg-blue-600/90 text-white rounded-full  flex items-center justify-center border-2 border-blue-600/60 hover:border-blue-600 transition-all duration-300 ease-in-out"
          >
            <GrEdit size={32} fill="white" />
          </NavLink>
        </div>
      </header>

      <div className="flex gap-20">
        <div className="w-1/3 noir-outline rounded-b-lg">
          <img
            src={perfume.image}
            alt={perfume.name}
            className="w-full h-68 object-cover mb-2 rounded-t-lg"
          />
          <div className="px-6 py-2">
            <p>{perfume.description}</p>
            <div className="border py-2 rounded-md bg-noir-dark text-noir-light px-2 my-6">
              <div className="flex items-center gap-2">
                <span>Opening Notes:</span>
                <ul>
                  {perfume.perfumeNotesOpen.map(note => (
                    <li key={note.id}>{note.name}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <span>Mid Notes:</span>
                <ul>
                  {perfume.perfumeNotesHeart.map(note => (
                    <li key={note.id}>{note.name}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <span>End Notes:</span>
                <ul>
                  {perfume.perfumeNotesClose.map(note => (
                    <li key={note.id}>{note.name}</li>
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

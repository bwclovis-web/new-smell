import { type LoaderFunctionArgs, NavLink, useLoaderData } from 'react-router'

import { getPerfumeByName } from '~/models/perfume.server'

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

const PerfumePage = () => {
  const { perfume } = useLoaderData<typeof loader>()
  return (
    <section>
      <header className="mb-4">
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

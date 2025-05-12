import { useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import { getAllPerfumes } from '~/models/perfume.server'

export const ROUTE_PATH = '/all-perfumes'

export const loader = async () => {
  const allPerfumes = await getAllPerfumes()
  return { allPerfumes }
}

const AllPerfumesPage = () => {
  const { allPerfumes } = useLoaderData<typeof loader>()
  return (
    <section>
      <header className="mb-4">
        <h1>All Perfumes</h1>
        <p>This is the All Perfumes page.</p>
      </header>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allPerfumes?.map(perfume => (
          <li key={perfume.id}>
            <LinkCard data={perfume} type="perfume" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AllPerfumesPage

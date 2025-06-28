import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import { getAllPerfumes } from '~/models/perfume.server'

export const ROUTE_PATH = '/all-perfumes'

export const loader = async () => {
  const allPerfumes = await getAllPerfumes()
  return { allPerfumes }
}
export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('allPerfumes.meta.title') },
    { name: 'description', content: t('allPerfumes.meta.description') }
  ]
}

const AllPerfumesPage = () => {
  const { t } = useTranslation()
  const { allPerfumes } = useLoaderData<typeof loader>()
  return (
    <section>
      <header className="mb-4 bg-noir-light/10 py-4 pl-2 pr-6'">
        <h1>{t('allPerfumes.heading')}</h1>
        <p className='text-xl'>{t('allPerfumes.subheading')}</p>
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

import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
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
import banner from '../images/perfume.webp'
const AllPerfumesPage = () => {
  const { t } = useTranslation()
  const { allPerfumes } = useLoaderData<typeof loader>()
  return (
    <section>
      <TitleBanner image={banner} heading={t('allPerfumes.heading')} subheading={t('allPerfumes.subheading')} />
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

import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import { getAvailablePerfumesForDecanting } from '~/models/perfume.server'

export const ROUTE_PATH = '/available-perfumes'

export const loader = async () => {
  const availablePerfumes = await getAvailablePerfumesForDecanting()
  return { availablePerfumes }
}

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('availablePerfumes.meta.title') },
    { name: 'description', content: t('availablePerfumes.meta.description') }
  ]
}

const AvailablePerfumesPage = () => {
  const { t } = useTranslation()
  const { availablePerfumes } = useLoaderData<typeof loader>()

  return (
    <section>
      <header className="mb-4">
        <h1>{t('availablePerfumes.heading')}</h1>
        <p>{t('availablePerfumes.subheading')}</p>
        <p className="text-sm text-gray-600 mt-2">
          {availablePerfumes.length} {t('availablePerfumes.count')}
        </p>
      </header>

      {availablePerfumes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('availablePerfumes.empty')}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availablePerfumes?.map(perfume => (
            <li key={perfume.id} className="relative">
              <LinkCard data={perfume} type="perfume" />
              {/* Show available amounts from users */}
              <div className="mt-2 p-2 bg-green-50 rounded-md">
                <p className="text-sm font-medium text-green-800 mb-1">
                  {t('availablePerfumes.availableFrom')}:
                </p>
                {perfume.userPerfume.map(userPerfume => (
                  <div key={userPerfume.id} className="text-xs text-green-700">
                    {userPerfume.user.name || userPerfume.user.email}:
                    {' '}
                    {userPerfume.available}
                    ml
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default AvailablePerfumesPage

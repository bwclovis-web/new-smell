import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import { getAvailablePerfumesForDecanting } from '~/models/perfume.server'

import banner from '../images/trading.webp'
export const ROUTE_PATH = '/trading-post'

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

const TradingPostPage = () => {
  const { t } = useTranslation()
  const { availablePerfumes } = useLoaderData<typeof loader>()

  return (
    <section>
      <TitleBanner image={banner} heading={t('availablePerfumes.heading')} subheading={t('availablePerfumes.subheading')}>
        <span className='bg-noir-gold p-2 mt-4 block max-w-max rounded-md uppercase font-semibold'>{availablePerfumes.length} {t('availablePerfumes.count')}</span>
      </TitleBanner>
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

export default TradingPostPage

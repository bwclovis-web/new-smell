import { useTranslation } from 'react-i18next'
import { type MetaFunction, useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard'
import TitleBanner from '~/components/Organisms/TitleBanner'
import { getPerfumeTypeLabel } from '~/data/SelectTypes'
import { getAvailablePerfumesForDecanting } from '~/models/perfume.server'
import { getUserDisplayName } from '~/utils/user'

import banner from '../images/trading.webp'
export const ROUTE_PATH = '/the-exchange'

export const loader = async () => {
  const availablePerfumes = await getAvailablePerfumesForDecanting()
  return { availablePerfumes }
}

export const meta: MetaFunction = () => [
  { title: 'The Exchange - Trading Post' },
  { name: 'description', content: 'Browse available perfumes for trading and decanting' }
]

const TradingPostPage = () => {
  const { t } = useTranslation()
  const { availablePerfumes } = useLoaderData<typeof loader>()

  return (
    <section>
      <TitleBanner image={banner} heading={t('tradingPost.heading')} subheading={t('tradingPost.subheading')}>
        <span className=' block max-w-max rounded-md uppercase font-semibold text-noir-gold-500 mx-auto'>{availablePerfumes.length} {t('tradingPost.count')}</span>
      </TitleBanner>

      {availablePerfumes.length === 0 ? (
        <div className="text-center py-8 bg-noir-gray/80 rounded-md mt-8 border-2 border-noir-light">
          <h2 className="text-noir-light font-black text-3xl text-shadow-md text-shadow-noir-dark">{t('tradingPost.empty')}</h2>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 inner-container py-6 auto-rows-fr">
          {availablePerfumes?.map(perfume => (
            <li key={perfume.id} className="relative">
              <LinkCard data={perfume} type="perfume">
                <div className="mt-2 rounded-md">
                  <p className="text-base font-medium text-noir-gold mb-1">
                    {t('tradingPost.availableFrom')}:
                  </p>

                  {perfume.userPerfume.map(userPerfume => (
                    <div key={userPerfume.id} className="mb-1">
                      <a href={`/trader/${userPerfume.userId}`} className="text-sm font-semibold text-blue-300 hover:text-noir-blue underline">
                        {getUserDisplayName(userPerfume.user)}:
                      </a>
                      <span className="text-sm ml-2 text-noir-gold-100">
                        {getPerfumeTypeLabel(userPerfume.type) || 'Unknown Type'}
                        {' '}
                        {userPerfume.available} ml
                      </span>
                    </div>
                  ))}
                </div>
              </LinkCard>
            </li>
          ))}
        </ul>
      )
      }
    </section >
  )
}

export default TradingPostPage

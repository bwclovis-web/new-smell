import { useTranslation } from 'react-i18next'
import { type MetaFunction, NavLink, useLoaderData } from 'react-router'

import LinkCard from '~/components/Organisms/LinkCard/LinkCard'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import { getAvailablePerfumesForDecanting } from '~/models/perfume.server'
import { getUserDisplayName } from '~/utils/user'

import banner from '../images/trading.webp'
export const ROUTE_PATH = '/trading-post'

export const loader = async () => {
  const availablePerfumes = await getAvailablePerfumesForDecanting()
  return { availablePerfumes }
}

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('tradingPost.meta.title') },
    { name: 'description', content: t('tradingPost.meta.description') }
  ]
}

const TradingPostPage = () => {
  const { t } = useTranslation()
  const { availablePerfumes } = useLoaderData<typeof loader>()

  return (
    <section>
      <TitleBanner image={banner} heading={t('tradingPost.heading')} subheading={t('tradingPost.subheading')}>
        <span className='bg-noir-gold p-2 mt-4 block max-w-max rounded-md uppercase font-semibold'>{availablePerfumes.length} {t('tradingPost.count')}</span>
      </TitleBanner>

      {availablePerfumes.length === 0 ? (
        <div className="text-center py-8 bg-noir-gray/80 rounded-md mt-8 border-2 border-noir-light">
          <h2 className="text-noir-light font-black text-3xl text-shadow-md text-shadow-noir-dark">{t('tradingPost.empty')}</h2>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availablePerfumes?.map(perfume => (
            <li key={perfume.id} className="relative">
              <LinkCard data={perfume} type="perfume" />
              {/* Show available amounts from users */}

              <div className="mt-2 p-2 bg-green-50 rounded-md">
                <p className="text-sm font-medium text-green-800 mb-1">
                  {t('tradingPost.availableFrom')}:
                </p>
                {perfume.userPerfume.map(userPerfume => (
                  <NavLink to={`/trader/${userPerfume.userId}`} key={userPerfume.id} className="text-xs text-green-700">
                    {getUserDisplayName(userPerfume.user)}:
                    {' '}
                    {userPerfume.available}
                    ml
                  </NavLink>
                ))}
              </div>

            </li>
          ))}
        </ul>
      )
      }
    </section >
  )
}

export default TradingPostPage

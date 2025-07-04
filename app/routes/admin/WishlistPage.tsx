import { useTranslation } from 'react-i18next'
import { type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData } from 'react-router'

import { VooDooLink } from '~/components/Atoms/Button/Button'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import WishlistItemCard from '~/components/Organisms/WishlistItemCard/WishlistItemCard'
import { getUserWishlist, removeFromWishlist } from '~/models/wishlist.server'
import { sharedLoader } from '~/utils/sharedLoader'

import banner from '../../images/wish.webp'
export const ROUTE_PATH = 'admin/wishlist'
export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('wishlist.meta.title') },
    { name: 'description', content: t('wishlist.meta.description') }
  ]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await sharedLoader(request)
  const wishlist = await getUserWishlist(user.id)
  return { wishlist }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await sharedLoader(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'remove') {
    const perfumeId = formData.get('perfumeId') as string
    await removeFromWishlist(user.id, perfumeId)
  }

  return null
}


const WishlistPage = () => {
  const { t } = useTranslation()
  const { wishlist } = useLoaderData<typeof loader>()
  return (
    <section>
      <TitleBanner image={banner} heading={t('wishlist.heading')} subheading={t('wishlist.subheading')}>
        <p className="bg-noir-gold max-w-max px-4 py-2 rounded-lg text-noir-light font-semibold text-lg shadow-md block mt-4">
          {wishlist.length}
          {' '}
          {t('wishlist.itemsInWishlist')}
        </p>
      </TitleBanner>

      {wishlist.length === 0
        ? (
          <div className="text-center py-12 bg-noir-gold border-2 border-noir-light dark:border-noir-dark rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('wishlist.empty.heading')}
            </h3>
            <p className="text-noir-light dark:text-gray-400 mb-4">
              {t('wishlist.empty.subheading')}
            </p>
            <VooDooLink
              url="/all-perfumes"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Perfumes
            </VooDooLink>
          </div>
        )
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map(item => {
              const isAvailable = item.perfume.userPerfume.length > 0
              const availableAmount = item.perfume.userPerfume.reduce((total, userPerfume) => total + parseFloat(userPerfume.available || '0'), 0)
              return (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  isAvailable={isAvailable}
                  availableAmount={availableAmount}
                />
              )
            })}
          </div>
        )}
    </section>
  )
}

export default WishlistPage

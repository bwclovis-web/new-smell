import { useTranslation } from 'react-i18next'
import { type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData } from 'react-router'

import { getUserWishlist } from '~/models/wishlist.server'
import { sharedLoader } from '~/utils/sharedLoader'

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

const WishlistPage = () => {
  const { t } = useTranslation()
  const { wishlist } = useLoaderData<typeof loader>()
  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('wishlist.heading')}
        </h1>
        <p className='mb-4'>{t('wishlist.subheading')}</p>
        <p className="text-gray-600 dark:text-gray-400">
          {wishlist.length}
          {' '}
          {t('wishlist.itemsInWishlist')}
        </p>
      </div>

      {wishlist.length === 0
        ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('wishlist.empty.heading')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('wishlist.empty.subheading')}
            </p>
            <NavLink
              to="/all-perfumes"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Perfumes
            </NavLink>
          </div>
        )
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border">
                <img
                  src={item.perfume.image || '/placeholder-perfume.jpg'}
                  alt={item.perfume.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {item.perfume.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    by
                    {' '}
                    {item.perfume.perfumeHouse?.name || 'Unknown House'}
                  </p>
                  {item.perfume.description && (
                    <p className="text-sm text-gray-700 mb-4">
                      {item.perfume.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Added
                      {' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <NavLink
                      to={`/perfume/${item.perfume.name}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </NavLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </section>
  )
}

export default WishlistPage

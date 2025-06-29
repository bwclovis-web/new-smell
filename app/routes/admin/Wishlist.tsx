import { useTranslation } from 'react-i18next'
import { type ActionFunctionArgs, Form, type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData } from 'react-router'

import { getUserWishlist, removeFromWishlist } from '~/models/wishlist.server'
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

interface WishlistItemCardProps {
  item: any
  isAvailable: boolean
  availableAmount: number
}

const WishlistItemCard = ({
  item,
  isAvailable,
  availableAmount
}: WishlistItemCardProps) => (
  <div
    className={`rounded-lg shadow-md overflow-hidden border transition-all duration-300 relative ${isAvailable
      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-700 shadow-green-100 dark:shadow-green-900/20'
      : 'bg-white dark:bg-gray-800'
      }`}
  >
    {/* Remove button */}
    <Form method="post" className="absolute top-2 right-2 z-10">
      <input type="hidden" name="intent" value="remove" />
      <input type="hidden" name="perfumeId" value={item.perfume.id} />
      <button
        type="submit"
        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors duration-200 group"
        title="Remove from wishlist"
      >
        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </Form>

    {isAvailable && (
      <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 text-center animate-pulse">
        🎉 AVAILABLE IN TRADING POST! 🎉
      </div>
    )}
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

      {isAvailable && (
        <AvailabilityInfo
          userPerfumes={item.perfume.userPerfume}
          availableAmount={availableAmount}
          perfumeName={item.perfume.name}
        />
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-gray-500">
          Added
          {' '}
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <NavLink
            to={`/perfume/${item.perfume.name}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </NavLink>
        </div>
      </div>
    </div>
  </div>
)

interface AvailabilityInfoProps {
  userPerfumes: any[]
  availableAmount: number
  perfumeName: string
}

const AvailabilityInfo = ({
  userPerfumes,
  availableAmount,
  perfumeName
}: AvailabilityInfoProps) => (
  <div className="mb-4 p-3 bg-green-100 dark:bg-green-800/30 rounded-lg border border-green-200 dark:border-green-700">
    <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
      Available from {userPerfumes.length} seller{userPerfumes.length > 1 ? 's' : ''}:
    </h4>
    {userPerfumes.map((userPerfume: any) => (
      <div key={userPerfume.id} className="flex justify-between items-center text-sm mb-1">
        <div>
          <span className="font-medium text-green-700 dark:text-green-300">
            {userPerfume.user.name || userPerfume.user.email}
          </span>
          <span className="text-green-600 dark:text-green-400 ml-2">
            ({userPerfume.available}ml available)
          </span>
        </div>
        <a
          href={`mailto:${userPerfume.user.email}?subject=Interest in ${perfumeName}&body=Hi! I saw that you have ${perfumeName} available for decanting in the trading post. I'm interested in purchasing some. Please let me know the details!`}
          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 underline"
        >
          Contact
        </a>
      </div>
    ))}
    <div className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
      Total: {availableAmount}ml available
    </div>
  </div>
)

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

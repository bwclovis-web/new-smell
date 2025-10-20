
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router-dom'

import MyScentsListItem from '~/components/Containers/MyScents/MyScentListItem'
import { VirtualScrollList } from '~/components/Molecules/VirtualScrollList'
import AddToCollectionModal from '~/components/Organisms/AddToCollectionModal'
import TitleBanner from '~/components/Organisms/TitleBanner'
import {
  addUserPerfume,
  getUserPerfumes,
  removeUserPerfume,
  updateAvailableAmount
} from '~/models/user.server'
import type { UserPerfumeI } from '~/types'
import { sharedLoader } from '~/utils/sharedLoader'

import banner from '../../images/perfume.webp'

export const ROUTE_PATH = '/admin/my-scents'

export const meta: MetaFunction = () => [
  { title: 'My Scents - Shadow and Sillage' },
  { name: 'description', content: 'Manage your personal collection of perfumes.' }
]
interface LoaderData {
  userPerfumes: UserPerfumeI[]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await sharedLoader(request)
  const userPerfumes = await getUserPerfumes(user.id)

  return { userPerfumes }
}
interface AddParams {
  userId: string
  perfumeId: string
  amount?: string
  price?: string
  placeOfPurchase?: string
}

const performAddAction = async ({
  userId,
  perfumeId,
  amount,
  price,
  placeOfPurchase
}: AddParams) => (
  await addUserPerfume({
    userId,
    perfumeId,
    amount,
    price,
    placeOfPurchase
  })
)

const performRemoveAction = async (userId: string, perfumeId: string) => (
  await removeUserPerfume(userId, perfumeId)
)

const performDecantAction = async (params: {
  userId: string;
  perfumeId: string;
  availableAmount: string;
  tradePrice?: string;
  tradePreference?: string;
  tradeOnly?: boolean;
}) => {
  const {
    userId,
    perfumeId,
    availableAmount,
    tradePrice,
    tradePreference,
    tradeOnly
  } = params
  return await updateAvailableAmount({
    userId,
    perfumeId,
    availableAmount,
    tradePrice,
    tradePreference,
    tradeOnly
  })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const perfumeId = formData.get('perfumeId') as string
  const actionType = formData.get('action') as string
  const amount = formData.get('amount') as string | undefined
  const price = formData.get('price') as string | undefined
  const placeOfPurchase = formData.get('placeOfPurchase') as string | undefined
  const availableAmount = formData.get('availableAmount') as string | undefined
  const tradePrice = formData.get('tradePrice') as string | undefined
  const tradePreference = formData.get('tradePreference') as string | undefined
  const tradeOnly = formData.get('tradeOnly') === 'true'
  const user = await sharedLoader(request)

  if (actionType === 'add') {
    return performAddAction({
      userId: user.id,
      perfumeId,
      amount,
      price,
      placeOfPurchase
    })
  }

  if (actionType === 'remove') {
    return performRemoveAction(user.id, perfumeId)
  }

  if (actionType === 'decant' && availableAmount) {
    const result = await performDecantAction({
      userId: user.id,
      perfumeId,
      availableAmount,
      tradePrice,
      tradePreference,
      tradeOnly
    })
    return result
  }

  throw new Response('Invalid action', { status: 400 })
}

const MyScentsPage = () => {
  const { userPerfumes: initialUserPerfumes } = useLoaderData() as LoaderData
  const [userPerfumes, setUserPerfumes] = useState(initialUserPerfumes)
  const { t } = useTranslation()

  useEffect(() => {
    setUserPerfumes(initialUserPerfumes)
  }, [initialUserPerfumes])

  // Render function for virtual scrolling
  const renderUserPerfume = (userPerfume: UserPerfumeI) => (
    <MyScentsListItem
      key={userPerfume.id}
      setUserPerfumes={setUserPerfumes}
      userPerfumes={userPerfumes}
      userPerfume={userPerfume}
    />
  )

  return (
    <section>
      <TitleBanner imagePos="object-bottom" image={banner} heading={t('myScents.heading')} subheading={t('myScents.subheading')} >
        <AddToCollectionModal />
      </TitleBanner>
      <div className='noir-border relative max-w-max mx-auto text-center flex flex-col items-center justify-center gap-4 p-4 my-6'>
        <h2 className="mb-2">{t('myScents.collection.heading')}</h2>
        {userPerfumes.length === 0
          ? (
            <div>
              <p className='text-noir-gold-100 text-xl'>{t('myScents.collection.empty.heading')}</p>
              <p className='text-noir-gold-500 italic'>{t('myScents.collection.empty.subheading')}</p>
            </div>
          )
          : userPerfumes.length > 10 ? (
            // Use virtual scrolling for large collections
            <VirtualScrollList
              items={userPerfumes}
              itemHeight={200}
              containerHeight={600}
              overscan={3}
              className="w-full style-scroll"
              renderItem={renderUserPerfume}
              itemClassName="w-full"
              emptyState={
                <div>
                  <p className='text-noir-gold-100 text-xl'>{t('myScents.collection.empty.heading')}</p>
                  <p className='text-noir-gold-500 italic'>{t('myScents.collection.empty.subheading')}</p>
                </div>
              }
            />
          ) : (
            // Use regular rendering for small collections
            <ul className="w-full">
              {userPerfumes.map(userPerfume => renderUserPerfume(userPerfume))}
            </ul>
          )}
      </div>
    </section>
  )
}

export default MyScentsPage

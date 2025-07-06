/* eslint-disable max-statements */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router-dom'

import MyScentsListItem from '~/components/Containers/MyScents/MyScentListItem/MyScentListItem'
import AddToCollectionModal from '~/components/Organisms/AddToCollectionModal/AddToCollectionModal'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import {
  addUserPerfume,
  getUserPerfumes,
  removeUserPerfume,
  updateAvailableAmount
} from '~/models/user.server'
import type { UserPerfumeI } from '~/types'
import { sharedLoader } from '~/utils/sharedLoader'

import banner from '../../images/myScents.webp'

export const ROUTE_PATH = '/admin/my-scents'

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('myScents.meta.title') },
    { name: 'description', content: t('myScents.meta.description') }
  ]
}
interface LoaderData {
  userPerfumes: UserPerfumeI[]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await sharedLoader(request)
  const userPerfumes = await getUserPerfumes(user.id)

  return { userPerfumes }
}

const performAddAction =
  async (userId: string, perfumeId: string, amount?: string) => (
    await addUserPerfume(userId, perfumeId, amount)
  )

const performRemoveAction = async (userId: string, perfumeId: string) => (
  await removeUserPerfume(userId, perfumeId)
)

const performDecantAction = async (
  userId: string,
  perfumeId: string,
  availableAmount: string
) => (
  await updateAvailableAmount(userId, perfumeId, availableAmount)
)

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const perfumeId = formData.get('perfumeId') as string
  const actionType = formData.get('action') as string
  const amount = formData.get('amount') as string | undefined
  const availableAmount = formData.get('availableAmount') as string | undefined
  const user = await sharedLoader(request)

  if (actionType === 'add') {
    return performAddAction(user.id, perfumeId, amount)
  }

  if (actionType === 'remove') {
    return performRemoveAction(user.id, perfumeId)
  }

  if (actionType === 'decant' && availableAmount) {
    const result = await performDecantAction(user.id, perfumeId, availableAmount)
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


  return (
    <section>
      <TitleBanner imagePos="object-bottom" image={banner} heading={t('myScents.heading')} subheading={t('myScents.subheading')} >
        <AddToCollectionModal className="mt-4" />
      </TitleBanner>
      <div className='bg-noir-gold text-center p-6 rounded-md border-4 border-noir-light/90 dark:border-noir-dark shadow-lg'>
        <h2 className="text-2xl font-semibold mb-2">My Collection</h2>
        {userPerfumes.length === 0
          ? (
            <div className="italic text-noir-light dark:text-noir-dark">
              <h3>{t('myScents.empty.heading')}</h3>
              <p>{t('myScents.empty.subheading')}</p>
            </div>
          )
          : (
            <ul className="w-full">
              {userPerfumes.map(userPerfume => (
                <MyScentsListItem
                  key={userPerfume.id}
                  setUserPerfumes={setUserPerfumes}
                  userPerfumes={userPerfumes}
                  userPerfume={userPerfume}
                />
              ))}
            </ul>
          )}
      </div>
    </section>
  )
}

export default MyScentsPage

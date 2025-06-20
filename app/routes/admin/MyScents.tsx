/* eslint-disable max-statements */
import { use, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useNavigation, useSubmit } from 'react-router-dom'

import { Button } from '~/components/Atoms/Button/Button'
import MyScentsModal from '~/components/Containers/MyScentsModal/MyScentsModal'
import Modal from '~/components/Organisms/Modal/Modal'
import {
  addUserPerfume,
  getUserPerfumes,
  removeUserPerfume
} from '~/models/user.server'
import SessionContext from '~/providers/sessionProvider'
import type { UserPerfumeI } from '~/types'
import { sharedLoader } from '~/utils/sharedLoader'

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


export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const perfumeId = formData.get('perfumeId') as string
  const actionType = formData.get('action') as string
  const amount = formData.get('amount') as string | undefined
  const user = await sharedLoader(request)

  if (actionType === 'add') {
    return performAddAction(user.id, perfumeId, amount)
  }

  if (actionType === 'remove') {
    return performRemoveAction(user.id, perfumeId)
  }

  throw new Response('Invalid action', { status: 400 })
}

const MyScentsPage = () => {
  const { userPerfumes } = useLoaderData() as LoaderData
  const submit = useSubmit()
  const modalTrigger = useRef<HTMLButtonElement>(null)
  const navigation = useNavigation()
  const { modalOpen, toggleModal } = use(SessionContext)
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()

  const handleRemovePerfume = (perfumeId: string) => {
    const formData = new FormData()
    formData.append('perfumeId', perfumeId)
    formData.append('action', 'remove')

    submit(formData, { method: 'post' })
  }

  return (
    <section>
      <header className='flex justify-between items-center mb-6'>
        <div className=' mb-4'>
          <h1 className="text-2xl font-bold">{t('myScents.heading')}</h1>
          <p>{t('myScents.subheading')}</p>
        </div>
        <Button
          className="z-50"
          onClick={() => {
            toggleModal(modalTrigger, '', 'create')
          }}
          ref={modalTrigger}
        >
          {t('myScents.addButton')}
        </Button>
      </header>
      <div className='bg-noir-light p-6 rounded-lg shadow-md'>
        <h2 className="text-2xl font-semibold mb-2">My Collection</h2>
        {userPerfumes.length === 0
          ? (
            <div className="italic text-gray-500">
              <h3>{t('myScents.empty.heading')}</h3>
              <p>{t('myScents.empty.subheading')}</p>
            </div>
          )
          : (
            <ul className="w-full">
              {userPerfumes.map(userPerfume => (
                <li key={userPerfume.id} className="border rounded p-4 flex flex-col w-full">
                  <div className="flex justify-start items-center mb-2 gap-6">
                    <h3 className="font-medium flex flex-col">
                      <span className='text-xl'>Name:</span>
                      <span className='text-2xl'>{userPerfume.perfume.name}</span>
                    </h3>
                    <p className='flex flex-col items-start justify-center'>
                      <span className='text-lg'>Amount:</span>
                      <span className='text-xl'>{userPerfume.amount}</span>
                    </p>
                    <button
                      className="text-green-500 text-sm justify-self-end"
                      onClick={() => toggleModal(modalTrigger, '', userPerfume)}
                      disabled={isSubmitting}
                      ref={modalTrigger}
                    >
                      EDIT
                    </button>
                    <button
                      className="text-red-500 text-sm justify-self-end"
                      onClick={() => handleRemovePerfume(userPerfume.perfume.id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>


      {modalOpen && (
        <Modal>
          <MyScentsModal />
        </Modal>
      )}
    </section>
  )
}

export default MyScentsPage

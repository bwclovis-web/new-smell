/* eslint-disable max-statements */
import { use, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GrEdit } from "react-icons/gr"
import { RiDeleteBin2Fill, RiDeleteBin3Fill } from "react-icons/ri"
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useNavigation, useSubmit } from 'react-router-dom'

import { Button } from '~/components/Atoms/Button/Button'
import CheckBox from '~/components/Atoms/CheckBox/CheckBox'
import DecantForm from '~/components/Containers/MyScents/DecantForm/DecantForm'
import MyScentsModal from '~/components/Containers/MyScents/MyScentsModal/MyScentsModal'
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
  const [decantOpenPerfumeId, setDecantOpenPerfumeId] = useState<string | null>(null)
  const { userPerfumes } = useLoaderData() as LoaderData
  const submit = useSubmit()
  const modalTrigger = useRef<HTMLButtonElement>(null)
  const navigation = useNavigation()
  const { modalOpen, toggleModal } = use(SessionContext)
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()

  const handleDecantConfirm = () => {
    // TODO: Implement decant logic
    setDecantOpenPerfumeId(null)
  }

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
                  <div className="flex justify-between items-center mb-2 gap-6">
                    <div className='flex gap-8 items-center'>
                      <h3 className="font-medium flex flex-col">
                        <span className='text-xl'>Name:</span>
                        <span className='text-2xl'>{userPerfume.perfume.name}</span>
                      </h3>
                      <p className='flex flex-col items-start justify-center'>
                        <span className='text-lg'>Amount:</span>
                        <span className='text-xl'>{userPerfume.amount}</span>
                      </p>
                      <CheckBox
                        inputType='wild'
                        label="Decant"
                        labelPosition='top'
                        onChange={() => {
                          const isCurrentlyOpen =
                            decantOpenPerfumeId === userPerfume.id
                          const newId = isCurrentlyOpen ? null : userPerfume.id
                          setDecantOpenPerfumeId(newId)
                        }}
                      />
                    </div>
                    <div className='flex gap-4'>
                      <Button
                        className="bg-green-600 text-sm hover:bg-green-700 focus:bg-green-800 disabled:bg-green-400 border-2 border-green-700"
                        onClick={() => toggleModal(modalTrigger, '', userPerfume)}
                        disabled={isSubmitting}
                        ref={modalTrigger}
                        style={'icon'}
                      >
                        <GrEdit size={30} stroke='white' />
                      </Button>
                      <Button
                        className="bg-red-500 text-sm border-2  hover:bg-red-600 focus:bg-red-700 disabled:bg-red-400 border-red-700"
                        onClick={() => handleRemovePerfume(userPerfume.perfume.id)}
                        disabled={isSubmitting}
                        style={'icon'}
                      >
                        {
                          isSubmitting ?
                            <RiDeleteBin3Fill size={30} fill='white' /> :
                            <RiDeleteBin2Fill size={30} fill='white' />
                        }
                      </Button>
                    </div>
                  </div>
                  {decantOpenPerfumeId === userPerfume.id && (
                    <DecantForm handleDecantConfirm={handleDecantConfirm} />
                  )}
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

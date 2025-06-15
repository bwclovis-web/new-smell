import { useContext, useRef } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
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

// eslint-disable-next-line max-statements
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
  const { modalOpen, toggleModal } = useContext(SessionContext)
  const isSubmitting = navigation.state === 'submitting'

  const handleRemovePerfume = (perfumeId: string) => {
    const formData = new FormData()
    formData.append('perfumeId', perfumeId)
    formData.append('action', 'remove')

    submit(formData, { method: 'post' })
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Scents</h1>
      <Button
        className="z-50"
        onClick={() => {
          toggleModal(modalTrigger, '')
        }}
        ref={modalTrigger}
      >
        OH HAI
      </Button>

      <h2 className="text-lg font-semibold mb-2">My Collection</h2>
      {userPerfumes.length === 0
        ? (
          <div className="italic text-gray-500">
            Your collection is empty. Add some perfumes!
          </div>
        )
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPerfumes.map(userPerfume => (
              <div key={userPerfume.id} className="border rounded p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{userPerfume.perfume.name}</h3>
                  <button
                    className="text-red-500 text-sm"
                    onClick={() => handleRemovePerfume(userPerfume.perfume.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Removing...' : 'Remove'}
                  </button>
                </div>
                <p>{userPerfume.amount}</p>
              </div>
            ))}
          </div>
        )}
      {modalOpen && (
        <Modal>
          <MyScentsModal />
        </Modal>
      )}
    </div>
  )
}

export default MyScentsPage

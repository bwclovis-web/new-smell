import { useState } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useNavigation, useSubmit } from 'react-router-dom'

import { getAllPerfumes } from '~/models/perfume.server'
import {
  addUserPerfume,
  getUserPerfumes,
  removeUserPerfume
} from '~/models/user.server'
import { sharedLoader } from '~/utils/sharedLoader'

export const ROUTE_PATH = '/admin/my-scents'

// Define types for our data
interface PerfumeHouse {
  id: string
  name: string
}

interface Perfume {
  id: string
  name: string
  description?: string
  perfumeHouse?: PerfumeHouse
}

interface UserPerfume {
  id: string
  userId: string
  perfumeId: string
  perfume: Perfume
}

interface LoaderData {
  userPerfumes: UserPerfume[]
  allPerfumes: Perfume[]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await sharedLoader(request)

  // Get user perfumes and all perfumes
  const userPerfumes = await getUserPerfumes(user.id)
  const allPerfumes = await getAllPerfumes()

  return { userPerfumes, allPerfumes }
}

const performAddAction = async (userId: string, perfumeId: string) => (
  await addUserPerfume(userId, perfumeId)
)

const performRemoveAction = async (userId: string, perfumeId: string) => (
  await removeUserPerfume(userId, perfumeId)
)

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const perfumeId = formData.get('perfumeId') as string
  const actionType = formData.get('action') as string

  const user = await sharedLoader(request)

  if (actionType === 'add') {
    return performAddAction(user.id, perfumeId)
  }

  if (actionType === 'remove') {
    return performRemoveAction(user.id, perfumeId)
  }

  throw new Response('Invalid action', { status: 400 })
}

const MyScentsPage = () => {
  const { userPerfumes, allPerfumes } = useLoaderData() as LoaderData
  const [selectedPerfume, setSelectedPerfume] = useState('')
  const submit = useSubmit()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const handleAddPerfume = () => {
    if (!selectedPerfume) {
      return
    }

    const formData = new FormData()
    formData.append('perfumeId', selectedPerfume)
    formData.append('action', 'add')

    submit(formData, { method: 'post' })
    setSelectedPerfume('')
  }

  const handleRemovePerfume = (perfumeId: string) => {
    const formData = new FormData()
    formData.append('perfumeId', perfumeId)
    formData.append('action', 'remove')

    submit(formData, { method: 'post' })
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Scents</h1>

      {/* Add new perfume to collection */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Add to My Collection</h2>
        <div className="flex gap-2">
          <select
            className="flex-grow p-2 border rounded"
            value={selectedPerfume}
            onChange={event => setSelectedPerfume(event.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select a perfume</option>
            {allPerfumes.map(perfume => (
              <option key={perfume.id} value={perfume.id}>
                {perfume.name}
                {perfume.perfumeHouse ? ` - ${perfume.perfumeHouse.name}` : ''}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
            onClick={handleAddPerfume}
            disabled={!selectedPerfume || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* User's perfume collection */}
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
                {userPerfume.perfume.perfumeHouse && (
                  <p className="text-sm text-gray-600 mb-2">
                    {userPerfume.perfume.perfumeHouse.name}
                  </p>
                )}
                {userPerfume.perfume.description && (
                  <p className="text-sm mt-auto">
                    {userPerfume.perfume.description.length > 100
                      ? `${userPerfume.perfume.description.substring(0, 100)}...`
                      : userPerfume.perfume.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

export default MyScentsPage

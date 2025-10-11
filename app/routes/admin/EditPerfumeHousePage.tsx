import { type SubmissionResult } from '@conform-to/react'
import { useEffect } from 'react'
import { type ActionFunctionArgs, type LoaderFunctionArgs, useActionData, useLoaderData } from 'react-router'
import { useNavigate } from 'react-router'

import PerfumeHouseForm from '~/components/Containers/Forms/PerfumeHouseForm'
import { getPerfumeHouseBySlug, updatePerfumeHouse } from '~/models/house.server'
import { FORM_TYPES } from '~/utils/constants'
export interface CustomSubmit extends SubmissionResult<string[]> {
  success: boolean
  data: {
    name: string
    slug: string
  }
}
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const formIdEntry = formData.get('houseId')?.toString()
  if (typeof formIdEntry !== 'string') {
    throw new Error('Form ID is required and must be a string')
  }
  const res = updatePerfumeHouse(formIdEntry, formData)

  return res
}
export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.houseSlug) {
    throw new Error('House ID is required')
  }
  const perfumeHouse = await getPerfumeHouseBySlug(params.houseSlug)
  if (!perfumeHouse) {
    throw new Response('House not found', { status: 404 })
  }
  return { perfumeHouse }
}
const EditHousePage = () => {
  const { perfumeHouse } = useLoaderData<typeof loader>()
  const lastResult = useActionData<CustomSubmit>()
  const navigate = useNavigate()

  useEffect(
    () => {
      if (lastResult?.success && lastResult.data) {
        navigate(`/perfume-house/${lastResult.data.name}`)
      }
    },
    [lastResult]
  )

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">
          {' '}
          Editing
          {' '}
          {perfumeHouse.name}
        </h1>
        <p className="text-lg">Edit</p>
      </header>
      <PerfumeHouseForm
        formType={FORM_TYPES.EDIT_HOUSE_FORM}
        lastResult={lastResult}
        data={perfumeHouse}
      />
    </section>
  )
}

export default EditHousePage

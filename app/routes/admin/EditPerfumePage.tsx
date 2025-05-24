import { useEffect } from 'react'
import { type ActionFunctionArgs, type LoaderFunctionArgs, useActionData, useLoaderData, useNavigate } from 'react-router'

import PerfumeForm from '~/components/Containers/Forms/PerfumeForm'
import { getAllHouses } from '~/models/house.server'
import { getPerfumeByName, updatePerfume } from '~/models/perfume.server'
import { FORM_TYPES } from '~/utils/constants'

import type { CustomSubmit } from './EditPerfumeHousePage'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const formIdEntry = formData.get('houseId')?.toString()
  if (typeof formIdEntry !== 'string') {
    throw new Error('Form ID is required and must be a string')
  }
  const res = updatePerfume(formIdEntry, formData)

  return res
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) {
    throw new Error('Perfume ID is required')
  }
  const perfume = await getPerfumeByName(params.id)
  const allHouses = await getAllHouses()
  if (!perfume) {
    throw new Response('House not found', { status: 404 })
  }
  return { perfume, allHouses }
}

const EditPerfumePage = () => {
  const { perfume, allHouses } = useLoaderData<typeof loader>()
  const lastResult = useActionData<CustomSubmit>()
  const navigate = useNavigate()
  useEffect(
    () => {
      if (lastResult?.success && lastResult.data) {
        navigate(`/perfume/${lastResult.data.name}`)
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
          {perfume.name}
        </h1>
        <p className="text-lg">Edit</p>
      </header>
      <PerfumeForm
        formType={FORM_TYPES.EDIT_PERFUME_FORM}
        lastResult={lastResult}
        data={perfume}
        allHouses={allHouses}
      />
    </section>
  )
}

export default EditPerfumePage

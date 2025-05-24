import { type SubmissionResult } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, useActionData } from 'react-router'

import PerfumeHouseForm from '~/components/Containers/Forms/PerfumeHouseForm'
import { createPerfumeHouse } from '~/models/house.server'
import { FORM_TYPES } from '~/utils/constants'
import { CreatePerfumeHouseSchema } from '~/utils/formValidationSchemas'

export const ROUTE_PATH = '/admin/create-perfume-house' as const

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const test = parseWithZod(formData, { schema: CreatePerfumeHouseSchema })
  if (test.status !== 'success') {
    return (test.reply())
  }
  const res = await createPerfumeHouse(formData)
  return res
}

const CreatePerfumeHousePage = () => {
  const lastResult = useActionData<SubmissionResult<string[]> | null>()

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Create Perfume House</h1>
        <p className="text-lg">Create a new perfume house</p>
      </header>
      <PerfumeHouseForm
        formType={FORM_TYPES.CREATE_HOUSE_FORM}
        lastResult={lastResult}
      />
    </section>
  )
}

export default CreatePerfumeHousePage

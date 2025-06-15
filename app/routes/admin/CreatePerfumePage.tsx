import { type SubmissionResult } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { useTranslation } from 'react-i18next'
import { type ActionFunctionArgs, type MetaFunction, useActionData, useLoaderData } from 'react-router'

import PerfumeForm from '~/components/Containers/Forms/PerfumeForm'
import { getAllHouses } from '~/models/house.server'
import { createPerfume } from '~/models/perfume.server'
import { FORM_TYPES } from '~/utils/constants'
import { CreatePerfumeSchema } from '~/utils/formValidationSchemas'

export const ROUTE_PATH = '/admin/create-perfume' as const
export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t('createPerfume.meta.title') },
    { name: 'description', content: t('createPerfume.meta.description') }
  ]
}
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const test = parseWithZod(formData, { schema: CreatePerfumeSchema })
  if (test.status !== 'success') {
    return (test.reply())
  }
  const res = createPerfume(formData)
  return res
}

export const loader = async () => {
  const allHouses = await getAllHouses()
  return { allHouses }
}

const CreatePerfumePage = () => {
  const { allHouses } = useLoaderData<typeof loader>()
  const lastResult = useActionData<SubmissionResult<string[]> | null>()
  const { t } = useTranslation()
  return (
    <section>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{t('createPerfume.heading')}</h1>
        <p className="text-lg">{t('createPerfume.subheading')}</p>
      </header>
      <PerfumeForm
        formType={FORM_TYPES.CREATE_PERFUME_FORM}
        lastResult={lastResult}
        data={null}
        allHouses={allHouses}
      />
    </section>
  )
}

export default CreatePerfumePage

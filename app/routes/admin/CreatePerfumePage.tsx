import { type SubmissionResult } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { useTranslation } from 'react-i18next'
import { type ActionFunctionArgs, type MetaFunction, useActionData, useLoaderData } from 'react-router'

import PerfumeForm from '~/components/Containers/Forms/PerfumeForm'
import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import { getAllHouses } from '~/models/house.server'
import { createPerfume } from '~/models/perfume.server'
import { FORM_TYPES } from '~/utils/constants'
import { CreatePerfumeSchema } from '~/utils/formValidationSchemas'

import banner from '../../images/perfumeCreate.webp'
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
  const allHouses = await getAllHouses({ selectFields: true, take: 1000 }) // Limit to 1000 houses and only essential fields
  return { allHouses }
}

const CreatePerfumePage = () => {
  const { allHouses } = useLoaderData<typeof loader>()
  const lastResult = useActionData<SubmissionResult<string[]> | null>()
  const { t } = useTranslation()
  return (
    <section>
      <TitleBanner imagePos="object-center" image={banner} heading={t('createPerfume.heading')} subheading={t('createPerfume.subheading')} />
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

import { type SubmissionResult } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { useTranslation } from "react-i18next"
import {
  type ActionFunctionArgs,
  type MetaFunction,
  useActionData,
} from "react-router"

import PerfumeHouseForm from "~/components/Containers/Forms/PerfumeHouseForm"
import TitleBanner from "~/components/Organisms/TitleBanner/TitleBanner"
import { createPerfumeHouse } from "~/models/house.server"
import { FORM_TYPES } from "~/utils/constants"
import { CreatePerfumeHouseSchema } from "~/utils/formValidationSchemas"

import banner from "../../images/createHouse.webp"
export const ROUTE_PATH = "/admin/create-perfume-house" as const
export const meta: MetaFunction = () => [
  { title: "Create Perfume House - Shadow and Sillage" },
  {
    name: "description",
    content: "Create a new perfume house in our database.",
  },
]
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const test = parseWithZod(formData, { schema: CreatePerfumeHouseSchema })
  if (test.status !== "success") {
    return test.reply()
  }
  const res = await createPerfumeHouse(formData)
  return res
}

const CreatePerfumeHousePage = () => {
  const lastResult = useActionData<SubmissionResult<string[]> | null>()
  const { t } = useTranslation()
  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("createHouse.heading")}
        subheading={t("createHouse.subheading")}
      />
      <PerfumeHouseForm
        formType={FORM_TYPES.CREATE_HOUSE_FORM}
        lastResult={lastResult}
      />
    </section>
  )
}

export default CreatePerfumeHousePage

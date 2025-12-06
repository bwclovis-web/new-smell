import { type SubmissionResult } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { useTranslation } from "react-i18next"
import {
  type ActionFunctionArgs,
  type MetaFunction,
  redirect,
  useActionData,
} from "react-router"

import PerfumeForm from "~/components/Containers/Forms/PerfumeForm"
import TitleBanner from "~/components/Organisms/TitleBanner/TitleBanner"
import { createPerfume } from "~/models/perfume.server"
import { FORM_TYPES } from "~/utils/constants"
import { CreatePerfumeSchema } from "~/utils/formValidationSchemas"
import { withActionErrorHandling, withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { requireAdmin } from "~/utils/requireAdmin.server"

import banner from "../../images/perfumeCreate.webp"
export const ROUTE_PATH = "/admin/create-perfume" as const
export const meta: MetaFunction = () => [
  { title: "Create Perfume - Shadow and Sillage" },
  { name: "description", content: "Create a new perfume in our database." },
]

export const action = withActionErrorHandling(
  async ({ request }: ActionFunctionArgs) => {
    await requireAdmin(request)
    
    const formData = await request.formData()
    const test = parseWithZod(formData, { schema: CreatePerfumeSchema })
    if (test.status !== "success") {
      return test.reply()
    }

    try {
      const newPerfume = await createPerfume(formData)
      return redirect(`/perfume/${newPerfume.slug}`)
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the perfume",
      }
    }
  },
  {
    context: { page: "create-perfume", action: "create-perfume" },
  }
)

export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    await requireAdmin(request)
    return {}
  },
  {
    context: { page: "create-perfume" },
    redirectOnAuth: "/sign-in?redirect=/admin/create-perfume",
    redirectOnAuthz: "/unauthorized",
  }
)

const CreatePerfumePage = () => {
  const lastResult = useActionData<SubmissionResult<string[]> | null>()
  const { t } = useTranslation()
  return (
    <section>
      <TitleBanner
        imagePos="object-center"
        image={banner}
        heading={t("createPerfume.heading")}
        subheading={t("createPerfume.subheading")}
      />
      <PerfumeForm
        formType={FORM_TYPES.CREATE_PERFUME_FORM}
        lastResult={lastResult}
        data={null}
      />
    </section>
  )
}

export default CreatePerfumePage

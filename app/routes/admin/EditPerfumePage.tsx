import { useEffect } from "react"
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  useActionData,
  useLoaderData,
  useNavigate,
} from "react-router"

import PerfumeForm from "~/components/Containers/Forms/PerfumeForm"
import { getPerfumeBySlug, updatePerfume } from "~/models/perfume.server"
import { FORM_TYPES } from "~/utils/constants"
import { withActionErrorHandling, withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { requireAdmin } from "~/utils/requireAdmin.server"

import type { CustomSubmit } from "./EditPerfumeHousePage"

export const action = withActionErrorHandling(
  async ({ request }: ActionFunctionArgs) => {
    await requireAdmin(request)

    const formData = await request.formData()
    const { requireCSRF } = await import("~/utils/server/csrf.server")
    await requireCSRF(request, formData)
    const formIdEntry = formData.get("perfumeId")?.toString()
    if (typeof formIdEntry !== "string") {
      throw new Error("Form ID is required and must be a string")
    }
    const res = await updatePerfume(formIdEntry, formData)
    return res
  },
  {
    context: { page: "edit-perfume", action: "update-perfume" },
  }
)

export const loader = withLoaderErrorHandling(
  async ({ params, request }: LoaderFunctionArgs) => {
    await requireAdmin(request)
    
    if (!params.perfumeSlug) {
      throw new Error("Perfume ID is required")
    }

    const perfume = await getPerfumeBySlug(params.perfumeSlug)
    if (!perfume) {
      throw new Response("Perfume not found", { status: 404 })
    }

    return { perfume }
  },
  {
    context: { page: "edit-perfume" },
    redirectOnAuth: "/sign-in",
    redirectOnAuthz: "/unauthorized",
  }
)

const EditPerfumePage = () => {
  const { perfume } = useLoaderData<typeof loader>()
  const lastResult = useActionData<CustomSubmit>()
  const navigate = useNavigate()
  useEffect(() => {
    if (lastResult?.success && lastResult.data) {
      navigate(`/perfume/${lastResult.data.slug}?cb=${Date.now()}`)
    }
  }, [lastResult, navigate])
  return (
    <section>
      <header className="mb-6">
        <h1 className="text-3xl font-bold"> Editing {perfume.name}</h1>
        <p className="text-lg">Edit</p>
      </header>
      <PerfumeForm
        formType={FORM_TYPES.EDIT_PERFUME_FORM}
        lastResult={lastResult}
        data={perfume}
      />
    </section>
  )
}

export default EditPerfumePage

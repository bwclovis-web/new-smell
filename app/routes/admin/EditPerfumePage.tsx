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

import type { CustomSubmit } from "./EditPerfumeHousePage"

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("EditPerfumePage action called")
  const formData = await request.formData()
  const formIdEntry = formData.get("perfumeId")?.toString()
  if (typeof formIdEntry !== "string") {
    throw new Error("Form ID is required and must be a string")
  }
  console.log("Calling updatePerfume with ID:", formIdEntry)
  const res = await updatePerfume(formIdEntry, formData)
  console.log("UpdatePerfume result:", res)
  return res
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (!params.perfumeSlug) {
    throw new Error("Perfume ID is required")
  }

  // Add cache-busting parameter
  const url = new URL(request.url)
  const cacheBuster = url.searchParams.get("cb") || Date.now().toString()

  console.log("EditPerfumePage loader called with cache buster:", cacheBuster)

  const perfume = await getPerfumeBySlug(params.perfumeSlug)
  if (!perfume) {
    throw new Response("Perfume not found", { status: 404 })
  }

  console.log("Loaded perfume notes:", {
    topNotes: perfume.perfumeNotesOpen?.length || 0,
    heartNotes: perfume.perfumeNotesHeart?.length || 0,
    baseNotes: perfume.perfumeNotesClose?.length || 0,
  })

  return { perfume }
}

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

import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  type MetaFunction,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import { CSRFToken } from "~/components/Molecules/CSRFToken"
import TitleBanner from "~/components/Organisms/TitleBanner/TitleBanner"
import {
  getPendingSubmissions,
  getPendingSubmissionById,
  updatePendingSubmissionStatus,
} from "~/models/pending-submission.server"
import { createPerfume } from "~/models/perfume.server"
import { createPerfumeHouse } from "~/models/house.server"
import { createError } from "~/utils/errorHandling"
import {
  withActionErrorHandling,
  withLoaderErrorHandling,
} from "~/utils/errorHandling.server"
import { requireAdmin } from "~/utils/requireAdmin.server"
import { sharedLoader } from "~/utils/sharedLoader"

import banner from "../../images/userAdmin.webp"

export const ROUTE_PATH = "/admin/pending-submissions" as const

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    const user = await sharedLoader(request)
    await requireAdmin(request)

    const url = new URL(request.url)
    const status = url.searchParams.get("status") as "pending" | "approved" | "rejected" | null

    const submissions = await getPendingSubmissions(status || undefined)
    return { submissions, currentUser: user }
  },
  {
    context: { page: "admin-pending-submissions" },
    redirectOnAuthz: "/unauthorized",
  }
)

export const action = withActionErrorHandling(
  async ({ request }: ActionFunctionArgs) => {
    await requireAdmin(request)

    const formData = await request.formData()
    const actionType = formData.get("action") as string
    const submissionId = formData.get("submissionId") as string
    const adminNotes = formData.get("adminNotes") as string | null

    if (!actionType || !submissionId) {
      return {
        success: false,
        error: "Missing required fields",
      }
    }

    const submission = await getPendingSubmissionById(submissionId)
    if (!submission) {
      return {
        success: false,
        error: "Submission not found",
      }
    }

    const currentUser = await sharedLoader(request)
    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized",
      }
    }

    if (actionType === "approve") {
      try {
        // Create the perfume or house from submission data
        if (submission.submissionType === "perfume") {
          const perfumeFormData = new FormData()
          Object.entries(submission.submissionData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(v => perfumeFormData.append(key, v))
            } else {
              perfumeFormData.append(key, value as string)
            }
          })

          await createPerfume(perfumeFormData)
        } else {
          const houseFormData = new FormData()
          Object.entries(submission.submissionData).forEach(([key, value]) => {
            houseFormData.append(key, value as string)
          })

          await createPerfumeHouse(houseFormData)
        }

        // Update submission status
        await updatePendingSubmissionStatus(
          submissionId,
          "approved",
          currentUser.id,
          adminNotes || undefined
        )

        return {
          success: true,
          message: `${
            submission.submissionType === "perfume" ? "Perfume" : "Perfume house"
          } created successfully`,
        }
      } catch (error) {
        console.error("Error approving submission:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to approve submission",
        }
      }
    } else if (actionType === "reject") {
      try {
        await updatePendingSubmissionStatus(
          submissionId,
          "rejected",
          currentUser.id,
          adminNotes || undefined
        )

        return {
          success: true,
          message: "Submission rejected",
        }
      } catch (error) {
        console.error("Error rejecting submission:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to reject submission",
        }
      }
    }

    return {
      success: false,
      error: "Invalid action",
    }
  },
  {
    context: { page: "admin-pending-submissions", action: "pending-submission-action" },
  }
)

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("pendingSubmissions.meta.title") },
    { name: "description", content: t("pendingSubmissions.meta.description") },
  ]
}

const PendingSubmissionsPage = () => {
  const { submissions, currentUser } = useLoaderData<typeof loader>()
  const actionData = useActionData<{ success: boolean; error?: string; message?: string }>()
  const navigation = useNavigation()
  const { t } = useTranslation()
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending")
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)

  const isSubmitting = navigation.state === "submitting"

  const pendingSubmissions = submissions.filter(s => s.status === "pending")
  const approvedSubmissions = submissions.filter(s => s.status === "approved")
  const rejectedSubmissions = submissions.filter(s => s.status === "rejected")

  const displaySubmissions =
    selectedStatus === "pending"
      ? pendingSubmissions
      : selectedStatus === "approved"
        ? approvedSubmissions
        : selectedStatus === "rejected"
          ? rejectedSubmissions
          : submissions

  return (
    <div>
      <TitleBanner
        image={banner}
        heading={t("pendingSubmissions.heading")}
        subheading={t("pendingSubmissions.subheading")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Result Messages */}
        {actionData && (
          <div
            className={`mb-6 p-4 rounded-md ${
              actionData.success
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            {actionData.success ? actionData.message : actionData.error}
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-6 flex gap-4">
          <Button
            variant={selectedStatus === "pending" ? "primary" : "secondary"}
            onClick={() => setSelectedStatus("pending")}
          >
            {t("pendingSubmissions.filters.pending")} ({pendingSubmissions.length})
          </Button>
          <Button
            variant={selectedStatus === "approved" ? "primary" : "secondary"}
            onClick={() => setSelectedStatus("approved")}
          >
            {t("pendingSubmissions.filters.approved")} ({approvedSubmissions.length})
          </Button>
          <Button
            variant={selectedStatus === "rejected" ? "primary" : "secondary"}
            onClick={() => setSelectedStatus("rejected")}
          >
            {t("pendingSubmissions.filters.rejected")} ({rejectedSubmissions.length})
          </Button>
          <Button
            variant={selectedStatus === "all" ? "primary" : "secondary"}
            onClick={() => setSelectedStatus("all")}
          >
            {t("pendingSubmissions.filters.all")} ({submissions.length})
          </Button>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {displaySubmissions.length === 0 ? (
            <div className="text-center py-12 text-noir-light">
              <p className="text-lg">{t("pendingSubmissions.empty")}</p>
            </div>
          ) : (
            displaySubmissions.map(submission => (
              <div
                key={submission.id}
                className="noir-border p-6 rounded-lg bg-noir-dark/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-noir-gold">
                      {submission.submissionData.name || "Unnamed"}
                    </h3>
                    <p className="text-sm text-noir-light mt-1">
                      {submission.submissionType === "perfume" ? "Perfume" : "Perfume House"} •{" "}
                      Submitted {new Date(submission.createdAt).toLocaleDateString()}
                      {submission.submittedByUser && (
                        <> • by {submission.submittedByUser.email}</>
                      )}
                    </p>
                    {submission.status !== "pending" && submission.reviewedByUser && (
                      <p className="text-sm text-noir-light mt-1">
                        {submission.status === "approved" ? "Approved" : "Rejected"} by{" "}
                        {submission.reviewedByUser.email} on{" "}
                        {submission.reviewedAt
                          ? new Date(submission.reviewedAt).toLocaleDateString()
                          : ""}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      submission.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : submission.status === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {submission.status}
                  </span>
                </div>

                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSubmission(
                        expandedSubmission === submission.id ? null : submission.id
                      )
                    }
                    className="text-noir-gold hover:text-noir-light transition-colors"
                  >
                    {expandedSubmission === submission.id
                      ? t("pendingSubmissions.hideDetails")
                      : t("pendingSubmissions.showDetails")}
                  </button>
                </div>

                {expandedSubmission === submission.id && (
                  <div className="mt-4 p-4 bg-noir-black/30 rounded-lg">
                    <h4 className="font-semibold text-noir-gold mb-2">
                      {t("pendingSubmissions.details")}
                    </h4>
                    <div className="space-y-2 text-noir-light">
                      {Object.entries(submission.submissionData).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-semibold text-noir-gold capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:{" "}
                          </span>
                          <span>
                            {Array.isArray(value) ? value.join(", ") : String(value || "N/A")}
                          </span>
                        </div>
                      ))}
                    </div>
                    {submission.adminNotes && (
                      <div className="mt-4 pt-4 border-t border-noir-gold/30">
                        <h5 className="font-semibold text-noir-gold mb-2">
                          {t("pendingSubmissions.adminNotes")}
                        </h5>
                        <p className="text-noir-light">{submission.adminNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {submission.status === "pending" && (
                  <Form method="POST" className="mt-4 flex gap-4">
                    <CSRFToken />
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <input type="hidden" name="action" value="approve" />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      className="max-w-max"
                    >
                      {isSubmitting ? t("pendingSubmissions.approving") : t("pendingSubmissions.approve")}
                    </Button>
                    <Form method="POST" className="inline">
                      <CSRFToken />
                      <input type="hidden" name="submissionId" value={submission.id} />
                      <input type="hidden" name="action" value="reject" />
                      <Button
                        type="submit"
                        variant="danger"
                        disabled={isSubmitting}
                        className="max-w-max"
                      >
                        {isSubmitting ? t("pendingSubmissions.rejecting") : t("pendingSubmissions.reject")}
                      </Button>
                    </Form>
                    <input
                      type="text"
                      name="adminNotes"
                      placeholder={t("pendingSubmissions.notesPlaceholder")}
                      className="flex-1 px-4 py-2 bg-noir-dark text-noir-light rounded border border-noir-gold/30"
                    />
                  </Form>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default PendingSubmissionsPage


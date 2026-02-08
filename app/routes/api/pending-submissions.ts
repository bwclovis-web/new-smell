import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from "react-router"

import { createPendingSubmission } from "~/models/pending-submission.server"
import { createAdminAlertsForPendingSubmission } from "~/models/pending-submission.server"
import { withActionErrorHandling, withLoaderErrorHandling } from "~/utils/server/errorHandling.server"
import { CreatePerfumeHouseSchema, CreatePerfumeSchema } from "~/utils/formValidationSchemas"

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    return json({ message: "Use POST to submit a pending submission" }, { status: 405 })
  },
  {
    context: { page: "pending-submissions" },
  }
)

export const action = withActionErrorHandling(
  async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const { requireCSRF } = await import("~/utils/server/csrf.server")
    await requireCSRF(request, formData)
    const submissionType = formData.get("submissionType") as "perfume" | "perfume_house"
    const submittedBy = formData.get("submittedBy") as string | null

    if (!submissionType || !["perfume", "perfume_house"].includes(submissionType)) {
      return json(
        { success: false, error: "Invalid submission type" },
        { status: 400 }
      )
    }

    // Validate based on submission type
    let validationResult
    if (submissionType === "perfume") {
      validationResult = parseWithZod(formData, { schema: CreatePerfumeSchema })
    } else {
      validationResult = parseWithZod(formData, { schema: CreatePerfumeHouseSchema })
    }

    if (validationResult.status !== "success") {
      return json(
        { success: false, errors: validationResult.error },
        { status: 400 }
      )
    }

    // Extract and sanitize submission data
    const submissionData: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (key !== "submissionType" && key !== "submittedBy" && key !== "csrf") {
        // Sanitize string values to prevent XSS
        if (typeof value === "string") {
          submissionData[key] = value
            .trim()
            .replace(/[<>]/g, "") // Remove angle brackets
            .replace(/javascript:/gi, "") // Remove javascript: protocol
            .replace(/on\w+=/gi, "") // Remove event handlers
            .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
        } else {
          submissionData[key] = value
        }
      }
    }

    try {
      // Create pending submission
      const pendingSubmission = await createPendingSubmission(
        submissionType === "perfume" ? "perfume" : "perfume_house",
        submissionData,
        submittedBy || undefined
      )

      // Create admin alerts
      await createAdminAlertsForPendingSubmission(
        pendingSubmission.id,
        submissionType === "perfume" ? "perfume" : "perfume_house",
        submissionData
      )

      return json({
        success: true,
        message: "Your submission has been received and is pending admin approval.",
        submissionId: pendingSubmission.id,
      })
    } catch (error) {
      console.error("Error creating pending submission:", error)
      return json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to submit request",
        },
        { status: 500 }
      )
    }
  },
  {
    context: { page: "pending-submissions", action: "create-pending-submission" },
  }
)


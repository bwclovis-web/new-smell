import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router"
import cookie from "cookie"

import { createPendingSubmission } from "~/models/pending-submission.server"
import { createAdminAlertsForPendingSubmission } from "~/models/pending-submission.server"
import { validateCSRFToken, CSRF_COOKIE_KEY, CSRF_HEADER_KEY } from "~/utils/server/csrf.server"
import { withActionErrorHandling, withLoaderErrorHandling } from "~/utils/server/errorHandling.server"
import { sharedLoader } from "~/utils/sharedLoader"
import { CreatePerfumeHouseSchema, CreatePerfumeSchema } from "~/utils/formValidationSchemas"

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    return Response.json({ message: "Use POST to submit a pending submission" }, { status: 405 })
  },
  {
    context: { page: "pending-submissions" },
  }
)

export const action = withActionErrorHandling(
  async ({ request }: ActionFunctionArgs) => {
    // Authenticate user first (before reading body)
    // sharedLoader may throw redirect, which we let propagate
    let user
    try {
      user = await sharedLoader(request)
      if (!user) {
        return Response.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        )
      }
    } catch (error) {
      // If it's a redirect, let it propagate
      if (error instanceof Response) {
        throw error
      }
      // Otherwise return error response (body hasn't been read yet)
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Read formData once (body can only be read once) - after all auth checks
    const formData = await request.formData()
    
    // Validate CSRF token - check header first, then formData
    const headerToken = request.headers.get(CSRF_HEADER_KEY)
    const formToken = formData.get("_csrf") as string
    const csrfToken = headerToken || formToken
    
    if (!csrfToken) {
      return Response.json(
        { success: false, error: "Invalid or missing CSRF token" },
        { status: 403 }
      )
    }

    // Get session token from cookies
    const cookieHeader = request.headers.get("cookie")
    const cookies = cookieHeader ? cookie.parse(cookieHeader) : {}
    const sessionToken = cookies[CSRF_COOKIE_KEY] || null

    if (!sessionToken || !validateCSRFToken(csrfToken, sessionToken)) {
      return Response.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      )
    }
    const submissionType = formData.get("submissionType") as "perfume" | "perfume_house"
    const submittedBy = formData.get("submittedBy") as string | null

    if (!submissionType || !["perfume", "perfume_house"].includes(submissionType)) {
      return Response.json(
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
      return Response.json(
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
        submissionType as "perfume" | "perfume_house",
        submissionData,
        user.id
      )

      // Create admin alerts
      await createAdminAlertsForPendingSubmission(
        pendingSubmission.id,
        submissionType === "perfume" ? "perfume" : "perfume_house",
        submissionData
      )

      return Response.json({
        success: true,
        message: "Your submission has been received and is pending admin approval.",
        submissionId: pendingSubmission.id,
      })
    } catch (error) {
      console.error("Error creating pending submission:", error)
      return Response.json(
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


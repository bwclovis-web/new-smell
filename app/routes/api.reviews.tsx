import type { LoaderFunction, ActionFunction } from "react-router"

/**
 * GET /api/reviews?perfumeId={id}&page=1&limit=10
 * Fetches reviews with optional filters and pagination.
 * Public endpoint - no authentication required.
 */
export const loader: LoaderFunction = async (args) => {
  // Dynamic imports to ensure server-only code is not bundled for client
  const {
    parseQueryParams,
    parsePaginationParams,
    withPublicLoader,
  } = await import("~/utils/api-route-helpers.server")
  const { getPerfumeReviews } = await import("~/models/perfumeReview.server")

  return withPublicLoader(
    async ({ request }) => {
      const params = parseQueryParams(request)
      const pagination = parsePaginationParams(request)

      // At least one of perfumeId or userId is required
      const perfumeId = params.get("perfumeId")
      const userId = params.get("userId")

      if (!perfumeId && !userId) {
        throw new Error("Either perfumeId or userId is required")
      }

      // Build filters
      const filters: any = {}
      if (perfumeId) filters.perfumeId = perfumeId
      if (userId) filters.userId = userId

      // Optional isApproved filter
      const isApproved = params.get("isApproved")
      if (isApproved !== null) {
        filters.isApproved = params.getBoolean("isApproved")
      }

      // Fetch reviews
      const result = await getPerfumeReviews(perfumeId || "", filters, {
        page: pagination.page,
        limit: pagination.limit,
      })

      return result
    },
    { context: { api: "reviews", method: "GET" } }
  )(args)
}

/**
 * POST /api/reviews
 * Handle review actions: create, update, delete, moderate
 * Requires authentication.
 */
export const action: ActionFunction = async (args) => {
  // Dynamic imports to ensure server-only code is not bundled for client
  const {
    parseFormData,
    withAuthenticatedAction,
  } = await import("~/utils/api-route-helpers.server")
  const {
    createPerfumeReview,
    deletePerfumeReview,
    getUserPerfumeReview,
    moderatePerfumeReview,
    updatePerfumeReview,
  } = await import("~/models/perfumeReview.server")
  const {
    createErrorResponse,
    createSuccessResponse,
  } = await import("~/utils/response.server")

  return withAuthenticatedAction(
    async ({ request, auth }) => {
      const formData = await parseFormData(request)
      const action = formData.required("_action")

      switch (action) {
        case "create": {
          const perfumeId = formData.required("perfumeId")
          const review = formData.required("review")

          // Check if user already has a review for this perfume
          const existingReview = await getUserPerfumeReview(auth.userId, perfumeId)
          if (existingReview) {
            return createErrorResponse("You have already reviewed this perfume", 400)
          }

          const newReview = await createPerfumeReview({
            userId: auth.userId,
            perfumeId,
            review,
          })

          return createSuccessResponse({
            message: "Review created successfully",
            data: newReview,
          })
        }

        case "update": {
          const reviewId = formData.required("reviewId")
          const review = formData.required("review")

          const updatedReview = await updatePerfumeReview(
            reviewId,
            { review },
            auth.userId
          )

          return createSuccessResponse({
            message: "Review updated successfully",
            data: updatedReview,
          })
        }

        case "delete": {
          const reviewId = formData.required("reviewId")

          await deletePerfumeReview(reviewId, auth.userId, auth.user.role)

          return createSuccessResponse({
            message: "Review deleted successfully",
          })
        }

        case "moderate": {
          // Only admin and editor roles can moderate
          if (auth.user.role !== "admin" && auth.user.role !== "editor") {
            return createErrorResponse("Insufficient permissions", 403)
          }

          const reviewId = formData.required("reviewId")
          const isApproved = formData.getBoolean("isApproved")

          const moderatedReview = await moderatePerfumeReview(reviewId, isApproved)

          return createSuccessResponse({
            message: "Review moderated successfully",
            data: moderatedReview,
          })
        }

        default:
          return createErrorResponse(`Invalid action: ${action}`, 400)
      }
    },
    { context: { api: "reviews", method: "POST" } }
  )(args)
}

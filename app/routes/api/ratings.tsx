import type { ActionFunction, LoaderFunction } from "react-router"

import {
  createPerfumeRating,
  getPerfumeRatings,
  getUserPerfumeRating,
  updatePerfumeRating,
} from "~/models/perfumeRating.server"
import {
  parseFormData,
  parseQueryParams,
  validateRating,
  validateRatingCategory,
  withAuthenticatedAction,
  withPublicLoader,
} from "~/utils/api-route-helpers.server"

/**
 * GET /api/ratings?perfumeId={id}
 * Fetches ratings and averages for a specific perfume.
 * Public endpoint - no authentication required.
 */
export const loader: LoaderFunction = withPublicLoader(
  async ({ request }) => {
    const params = parseQueryParams(request)
    const perfumeId = params.required("perfumeId")

    const ratingsData = await getPerfumeRatings(perfumeId)
    return ratingsData
  },
  { context: { api: "ratings", method: "GET" } }
)

/**
 * POST /api/ratings
 * Create or update a rating for a perfume.
 * Requires authentication.
 */
export const action: ActionFunction = withAuthenticatedAction(
  async ({ request, auth }) => {
    const formData = await parseFormData(request)

    // Extract and validate required fields
    const perfumeId = formData.required("perfumeId")
    const category = formData.required("category")
    const rating = formData.getInt("rating")

    // Validate rating value and category
    validateRating(rating)
    validateRatingCategory(category)

    // Check if rating already exists
    const existingRating = await getUserPerfumeRating(auth.userId, perfumeId)

    if (existingRating) {
      // Update existing rating
      await updatePerfumeRating(existingRating.id, {
        [category]: rating,
      })
    } else {
      // Create new rating
      await createPerfumeRating({
        userId: auth.userId,
        perfumeId,
        [category]: rating,
      })
    }

    return { message: "Rating saved successfully" }
  },
  { context: { api: "ratings", method: "POST" } }
)

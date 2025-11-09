import type { ActionFunction, LoaderFunction } from "react-router"

import {
  getTraderFeedbackByReviewer,
  getTraderFeedbackList,
  getTraderFeedbackSummary,
  removeTraderFeedback,
  submitTraderFeedback,
} from "~/models/traderFeedback.server"
import {
  parseFormData,
  parsePaginationParams,
  parseQueryParams,
  withAuthenticatedAction,
  withPublicLoader,
} from "~/utils/api-route-helpers.server"
import {
  createErrorResponse,
  createSuccessResponse,
} from "~/utils/response.server"

export const loader: LoaderFunction = withPublicLoader(
  async ({ request }) => {
    const params = parseQueryParams(request)
    const pagination = parsePaginationParams(request)

    const traderId = params.required("traderId")
    const includeComments = params.getBoolean("includeComments")
    const viewerId = params.get("viewerId")

    const summary = await getTraderFeedbackSummary(traderId)

    const comments = includeComments
      ? await getTraderFeedbackList(traderId, {
          limit: pagination.limit,
          offset: pagination.skip,
        })
      : []

    const viewerFeedback =
      viewerId && viewerId !== traderId
        ? await getTraderFeedbackByReviewer(traderId, viewerId)
        : null

    return {
      summary,
      comments,
      viewerFeedback,
    }
  },
  { context: { api: "trader-feedback", method: "GET" } }
)

export const action: ActionFunction = withAuthenticatedAction(
  async ({ request, auth }) => {
    const formData = await parseFormData(request)
    const intent = formData.required("_action")

    switch (intent) {
      case "submit": {
        const traderId = formData.required("traderId")
        const rating = formData.getInt("rating")
        const comment = formData.get("comment")

        if (!rating) {
          return createErrorResponse("Rating is required", 400)
        }

        const feedback = await submitTraderFeedback({
          traderId,
          reviewerId: auth.userId,
          rating,
          comment,
        })

        const summary = await getTraderFeedbackSummary(traderId)

        return createSuccessResponse({
          message: "Feedback submitted",
          data: {
            feedback,
            summary,
          },
        })
      }

      case "delete": {
        const traderId = formData.required("traderId")
        const reviewerId = auth.userId

        await removeTraderFeedback(traderId, reviewerId)

        const summary = await getTraderFeedbackSummary(traderId)

        return createSuccessResponse({
          message: "Feedback removed",
          data: {
            summary,
          },
        })
      }

      default:
        return createErrorResponse(`Unsupported action: ${intent}`, 400)
    }
  },
  { context: { api: "trader-feedback", method: "POST" } }
)


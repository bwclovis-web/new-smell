import type { ActionFunctionArgs } from "react-router"

import {
  addToWishlist,
  removeFromWishlist,
  updateWishlistVisibility,
} from "~/models/wishlist.server"
import { processDecantInterestAlerts } from "~/utils/alert-processors"
import { authenticateUser } from "~/utils/auth.server"
import {
  validationError,
  withActionErrorHandling,
} from "~/utils/errorHandling.patterns"
import { WishlistActionSchema } from "~/utils/formValidationSchemas"
import { createErrorResponse, createJsonResponse } from "~/utils/response.server"
import { validateFormData } from "~/utils/validation"

const processWishlistAction = async (
  userId: string,
  perfumeId: string,
  actionType: string,
  isPublic?: boolean
) => {
  if (actionType === "add") {
    const result = await addToWishlist(userId, perfumeId, isPublic || false)

    // Process decant interest alerts when someone adds to wishlist
    try {
      await processDecantInterestAlerts(perfumeId, userId)
    } catch (error) {
      const { ErrorHandler } = await import("~/utils/errorHandling")
      ErrorHandler.handle(error, {
        api: "wishlist",
        action: "processDecantAlerts",
        perfumeId,
        userId,
      })
      // Don't fail the wishlist operation if alert processing fails
    }

    return result
  }
  if (actionType === "remove") {
    return await removeFromWishlist(userId, perfumeId)
  }
  if (actionType === "updateVisibility") {
    if (isPublic === undefined) {
      throw validationError("isPublic is required for updateVisibility action", {
        field: "isPublic",
        action: "updateVisibility",
      })
    }
    return await updateWishlistVisibility(userId, perfumeId, isPublic)
  }
  throw validationError("Invalid action type", {
    actionType,
    validActions: ["add", "remove", "updateVisibility"],
  })
}

const processAuthenticatedRequest = async (
  request: Request,
  perfumeId: string,
  actionType: string,
  isPublic?: boolean
) => {
  const authResult = await authenticateUser(request)

  if (!authResult.success) {
    return createErrorResponse(authResult.error!, authResult.status)
  }

  const result = await processWishlistAction(
    authResult.user.id,
    perfumeId,
    actionType,
    isPublic
  )

  return createJsonResponse(result)
}

const processRequest = async (request: Request) => {
  const formData = await request.formData()

  const validation = validateFormData(WishlistActionSchema, formData)
  if (!validation.success) {
    return createErrorResponse("Validation failed", 400, validation.errors)
  }

  const { perfumeId, action: actionType, isPublic } = validation.data!

  return await processAuthenticatedRequest(request, perfumeId, actionType, isPublic)
}

export const action = withActionErrorHandling(
  async ({ request }: ActionFunctionArgs) => {
    return await processRequest(request)
  },
  {
    context: { api: "wishlist", route: "api/wishlist" },
  }
)

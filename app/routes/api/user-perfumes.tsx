import { parseCookies, verifyJwt } from "@api/utils"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"

import { getAllPerfumes } from "~/models/perfume.server"
import {
  addPerfumeComment,
  addUserPerfume,
  deletePerfumeComment,
  getUserById,
  getUserPerfumes,
  removeUserPerfume,
  updateAvailableAmount,
  updatePerfumeComment,
} from "~/models/user.server"
import { processWishlistAvailabilityAlerts } from "~/utils/alert-processors"
import {
  withActionErrorHandling,
  withLoaderErrorHandling,
} from "~/utils/errorHandling.server"

// Type definitions
type AuthResult = {
  success: boolean
  error?: string
  status?: number
  user?: any
}

type PerfumeActionParams = {
  user: any
  perfumeId: string
  actionType: string
  amount?: string
  comment?: string
  isPublic?: boolean
  userPerfumeId?: string
  commentId?: string
  tradePrice?: string
  tradePreference?: string
  tradeOnly?: boolean
}

// Helper functions for authentication
const getTokenFromRequest = (request: Request) => {
  const cookieHeader = request.headers.get("cookie") || ""
  const cookies = parseCookies({ headers: { cookie: cookieHeader } })
  return cookies.accessToken || cookies.token
}

const validateToken = (token: string): { valid: boolean; userId?: string } => {
  if (!token) {
    return { valid: false }
  }

  const payload = verifyJwt(token)
  if (!payload || !payload.userId) {
    return { valid: false }
  }

  return { valid: true, userId: payload.userId }
}

// Helper function to handle user lookup based on token validation
const getUserFromValidation = async (validation: {
  valid: boolean
  userId?: string
}): Promise<AuthResult> => {
  if (!validation.valid || !validation.userId) {
    return {
      success: false,
      error: "Invalid authentication token",
      status: 401,
    }
  }

  const user = await getUserById(validation.userId)
  if (!user) {
    return { success: false, error: "User not found", status: 401 }
  }

  return { success: true, user }
}

// Helper function to authenticate the user
const authenticateUser = async (request: Request): Promise<AuthResult> => {
  const token = getTokenFromRequest(request)

  if (!token) {
    return { success: false, error: "User not authenticated", status: 401 }
  }

  const validation = validateToken(token)
  return getUserFromValidation(validation)
}

// Helper functions for different action types
const handleAddAction = async (user: any, perfumeId: string, amount?: string) => {
  const result = await addUserPerfume({
    userId: user.id,
    perfumeId,
    amount,
  })

  // Process wishlist availability alerts when a perfume becomes available
  if (amount && parseFloat(amount) > 0) {
    try {
      await processWishlistAvailabilityAlerts(perfumeId)
    } catch (error) {
      const { ErrorHandler } = await import("~/utils/errorHandling")
      ErrorHandler.handle(error, {
        api: "user-perfumes",
        action: "processWishlistAlerts-add",
        perfumeId,
      })
      // Don't fail the operation if alert processing fails
    }
  }

  return result
}

const handleRemoveAction = async (user: any, userPerfumeId: string) =>
  removeUserPerfume(user.id, userPerfumeId)

const handleDecantAction = async (params: {
  user: any
  userPerfumeId: string
  perfumeId?: string
  amount?: string
  tradePrice?: string
  tradePreference?: string
  tradeOnly?: boolean
}) => {
  const {
    user,
    userPerfumeId,
    perfumeId,
    amount = "0",
    tradePrice,
    tradePreference,
    tradeOnly,
  } = params
  const result = await updateAvailableAmount({
    userId: user.id,
    userPerfumeId,
    availableAmount: amount,
    tradePrice,
    tradePreference,
    tradeOnly,
  })

  // Process wishlist availability alerts when a perfume becomes available
  if (amount && parseFloat(amount) > 0 && perfumeId) {
    try {
      await processWishlistAvailabilityAlerts(perfumeId)
    } catch (error) {
      const { ErrorHandler } = await import("~/utils/errorHandling")
      ErrorHandler.handle(error, {
        api: "user-perfumes",
        action: "processWishlistAlerts-decant",
        perfumeId,
      })
      // Don't fail the operation if alert processing fails
    }
  }

  return result
}

const handleAddCommentAction = async (params: {
  user: any
  perfumeId: string
  comment?: string
  isPublic?: boolean
  userPerfumeId?: string
}) => {
  const { user, perfumeId, comment, isPublic, userPerfumeId } = params

  if (!comment || !userPerfumeId) {
    return { success: false, error: "Comment and userPerfumeId are required" }
  }

  return await addPerfumeComment({
    userId: user.id,
    perfumeId,
    comment,
    isPublic,
    userPerfumeId,
  })
}

const handleToggleCommentVisibilityAction = async (
  user: any,
  commentId?: string,
  isPublic?: boolean
) => {
  if (!commentId) {
    return { success: false, error: "Comment ID is required" }
  }

  return await updatePerfumeComment({
    userId: user.id,
    commentId,
    isPublic,
  })
}

const handleDeleteCommentAction = async (user: any, commentId?: string) => {
  if (!commentId) {
    return { success: false, error: "Comment ID is required" }
  }

  return await deletePerfumeComment(user.id, commentId)
}

// Helper function to process the user perfume action
const processUserPerfumeAction = async (params: PerfumeActionParams) => {
  const {
    user,
    perfumeId,
    actionType,
    amount,
    comment,
    isPublic,
    userPerfumeId,
    commentId,
    tradePrice,
    tradePreference,
    tradeOnly,
  } = params

  switch (actionType) {
    case "add":
      return handleAddAction(user, perfumeId, amount)
    case "remove":
      return handleRemoveAction(user, userPerfumeId || perfumeId)
    case "decant":
      return handleDecantAction({
        user,
        userPerfumeId: userPerfumeId || perfumeId,
        perfumeId,
        amount,
        tradePrice,
        tradePreference,
        tradeOnly,
      })
    case "add-comment":
      return handleAddCommentAction({
        user,
        perfumeId,
        comment,
        isPublic,
        userPerfumeId,
      })
    case "toggle-comment-visibility":
      return handleToggleCommentVisibilityAction(user, commentId, isPublic)
    case "delete-comment":
      return handleDeleteCommentAction(user, commentId)
    default:
      return { success: false, error: "Invalid action" }
  }
}

// Helper function to handle successful authentication in loader
const handleAuthSuccess = async (user: any) => {
  const userPerfumes = await getUserPerfumes(user.id)
  const allPerfumes = await getAllPerfumes()

  return new Response(JSON.stringify({ success: true, userPerfumes, allPerfumes }), {
    headers: { "Content-Type": "application/json" },
  })
}

// Helper function to handle authentication errors
const handleAuthError = (result: AuthResult) => new Response(JSON.stringify({ success: false, error: result.error }), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  })

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    const authResult = await authenticateUser(request)

    if (!authResult.success) {
      return handleAuthError(authResult)
    }

    return handleAuthSuccess(authResult.user)
  },
  {
    context: { api: "user-perfumes", action: "loader" },
  }
)

// Helper function to validate perfume ID
const validatePerfumeId = (perfumeId: string | null | undefined) => {
  if (!perfumeId || perfumeId.trim() === "") {
    return new Response(
      JSON.stringify({ success: false, error: "Perfume ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
  return null
}

// Helper function to handle errors in action
const handleActionError = async (error: any) => {
  const { ErrorHandler } = await import("~/utils/errorHandling")
  const appError = ErrorHandler.handle(error, {
    api: "user-perfumes",
    action: "action",
  })
  return new Response(
    JSON.stringify({ success: false, error: appError.userMessage }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  )
}

// Helper function to process form data
const processFormData = async (request: Request) => {
  const formData = await request.formData()

  const result = {
    perfumeId: formData.get("perfumeId") as string,
    actionType: formData.get("action") as string,
    amount: formData.get("amount") as string | undefined,
    comment: formData.get("comment") as string | undefined,
    isPublic: formData.get("isPublic") === "true",
    userPerfumeId: formData.get("userPerfumeId") as string | undefined,
    commentId: formData.get("commentId") as string | undefined,
    tradePrice: formData.get("tradePrice") as string | undefined,
    tradePreference: formData.get("tradePreference") as string | undefined,
    tradeOnly: formData.get("tradeOnly") === "true",
  }

  return result
}

// Helper function to prepare perfume action
const prepareAction = async (params: {
  authResult: AuthResult
  perfumeId: string
  actionType: string
  amount?: string
  comment?: string
  isPublic?: boolean
  userPerfumeId?: string
  commentId?: string
  tradePrice?: string
  tradePreference?: string
  tradeOnly?: boolean
}) => {
  const {
    authResult,
    perfumeId,
    actionType,
    amount,
    comment,
    isPublic,
    userPerfumeId,
    commentId,
    tradePrice,
    tradePreference,
    tradeOnly,
  } = params

  const result = await processUserPerfumeAction({
    user: authResult.user,
    perfumeId,
    actionType,
    amount,
    comment,
    isPublic,
    userPerfumeId,
    commentId,
    tradePrice,
    tradePreference,
    tradeOnly,
  })

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  })
}

// Helper function to process action request
const processActionRequest = async (request: Request) => {
  const formData = await processFormData(request)
  const { perfumeId, actionType } = formData

  const validationError = validatePerfumeId(perfumeId)
  if (validationError) {
    return validationError
  }

  const authResult = await authenticateUser(request)
  if (!authResult.success) {
    return handleAuthError(authResult)
  }

  // At this point, we know perfumeId and actionType are not null due to validation
  return prepareAction({
    authResult,
    perfumeId: perfumeId!,
    actionType: actionType!,
    amount: formData.amount,
    comment: formData.comment,
    isPublic: formData.isPublic,
    userPerfumeId: formData.userPerfumeId,
    commentId: formData.commentId,
    tradePrice: formData.tradePrice,
    tradePreference: formData.tradePreference,
    tradeOnly: formData.tradeOnly,
  })
}

// Action function to add or remove user perfumes
export const action = withActionErrorHandling(
  async ({ request }: ActionFunctionArgs) => await processActionRequest(request),
  {
    context: { api: "user-perfumes", action: "action" },
  }
)

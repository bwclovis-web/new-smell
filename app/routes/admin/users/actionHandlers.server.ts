import {
  deleteUserSafely,
  softDeleteUser,
  updateUserRole,
} from "~/models/admin.server"
import type { AdminRoleValue } from "~/utils/constants"

import { isRoleValue } from "./roleUtils"

export type ActionData = {
  success: boolean
  message: string
  userId?: string
  role?: AdminRoleValue
}

export type ParsedAction =
  | { type: "delete"; userId: string }
  | { type: "soft-delete"; userId: string }
  | { type: "update-role"; userId: string; role: AdminRoleValue }

export type ParseActionResult =
  | { success: true; action: ParsedAction }
  | { success: false; error: ActionData }

export const parseAction = (formData: FormData): ParseActionResult => {
  const actionTypeEntry = formData.get("action")
  const userIdEntry = formData.get("userId")
  const actionType =
    typeof actionTypeEntry === "string" ? actionTypeEntry : null
  const userId = typeof userIdEntry === "string" ? userIdEntry : null

  if (!actionType) {
    return {
      success: false,
      error: { success: false, message: "Action type is required" },
    }
  }

  if (!userId) {
    return {
      success: false,
      error: { success: false, message: "User ID is required" },
    }
  }

  if (actionType === "delete" || actionType === "soft-delete") {
    return { success: true, action: { type: actionType, userId } }
  }

  if (actionType === "update-role") {
    const roleEntry = formData.get("role")

    if (!isRoleValue(roleEntry)) {
      return {
        success: false,
        error: {
          success: false,
          message: "Invalid role selection",
          userId,
        },
      }
    }

    return {
      success: true,
      action: { type: "update-role", userId, role: roleEntry },
    }
  }

  return {
    success: false,
    error: { success: false, message: "Invalid action", userId },
  }
}

export const executeAction = async (
  parsedAction: ParsedAction,
  adminUserId: string
): Promise<ActionData> => {
  switch (parsedAction.type) {
    case "delete": {
      const result = await deleteUserSafely(parsedAction.userId, adminUserId)
      return { ...result, userId: parsedAction.userId }
    }
    case "soft-delete": {
      const result = await softDeleteUser(parsedAction.userId, adminUserId)
      return { ...result, userId: parsedAction.userId }
    }
    case "update-role": {
      const result = await updateUserRole(
        parsedAction.userId,
        parsedAction.role,
        adminUserId
      )
      return {
        ...result,
        userId: parsedAction.userId,
        role: parsedAction.role,
      }
    }
    default: {
      return { success: false, message: "Invalid action" }
    }
  }
}


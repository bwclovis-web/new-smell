import { type ActionFunctionArgs } from "react-router"

import { requireUser } from "~/models/session.server"
import { changePassword } from "~/models/user.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Get the current user
    const user = await requireUser({ userSession: { user: null } })

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const formData = await request.formData()
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmNewPassword = formData.get("confirmNewPassword") as string

    // Basic validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return { success: false, error: "All fields are required" }
    }

    if (newPassword !== confirmNewPassword) {
      return { success: false, error: "New passwords do not match" }
    }

    if (currentPassword === newPassword) {
      return {
        success: false,
        error: "New password must be different from current password",
      }
    }

    // Change the password
    const result = await changePassword(user.id, currentPassword, newPassword)

    return result
  } catch (error) {
    const { ErrorHandler } = await import("~/utils/errorHandling")
    const appError = ErrorHandler.handle(error, {
      api: "change-password",
      userId: user?.id,
    })
    return {
      success: false,
      error: appError.userMessage,
    }
  }
}

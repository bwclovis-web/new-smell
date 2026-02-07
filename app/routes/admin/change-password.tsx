import { useActionData, useNavigation } from "react-router"

import ChangePasswordForm from "~/components/Molecules/ChangePasswordForm/ChangePasswordForm"
import { changePassword } from "~/models/user.server"
import { sharedLoader } from "~/utils/sharedLoader"

export const ROUTE_PATH = "/admin/change-password" as const

export const loader = async ({ request }: { request: Request }) => {
  const user = await sharedLoader(request)
  return { user }
}

export const action = async ({ request }: { request: Request }) => {
  try {
    const user = await sharedLoader(request)

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const formData = await request.formData()
    const { requireCSRF } = await import("~/utils/server/csrf.server")
    await requireCSRF(request, formData)
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
      page: "change-password",
      userId: user?.id,
    })
    return {
      success: false,
      error: appError.userMessage,
    }
  }
}

export default function ChangePasswordPage() {
  const actionData = useActionData() as any
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <ChangePasswordForm actionData={actionData} isSubmitting={isSubmitting} />
        </div>
      </div>
    </div>
  )
}

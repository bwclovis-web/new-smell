import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { Form, useActionData, useLoaderData, useNavigation } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import { CSRFToken } from "~/components/Molecules/CSRFToken"
import TitleBanner from "~/components/Organisms/TitleBanner/TitleBanner"
import {
  deleteUserSafely,
  getAllUsersWithCounts,
  softDeleteUser,
} from "~/models/admin.server"
import { createError } from "~/utils/errorHandling"
import {
  withActionErrorHandling,
  withLoaderErrorHandling,
} from "~/utils/errorHandling.server"
import { sharedLoader } from "~/utils/sharedLoader"
import { getUserDisplayName } from "~/utils/user"

import banner from "../../images/myprofile.webp"

export const ROUTE_PATH = "/admin/users" as const

type ActionData = {
  success: boolean
  message: string
  userId?: string
}

export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    const user = await sharedLoader(request)

    if (!user || user.role !== "admin") {
      throw createError.authorization("Admin access required")
    }

    const users = await getAllUsersWithCounts()
    return { users, currentUser: user }
  },
  {
    context: { page: "admin-users" },
    redirectOnAuthz: "/unauthorized",
  }
)

export const action = withActionErrorHandling(
  async ({ request }: ActionFunctionArgs): Promise<ActionData> => {
    const user = await sharedLoader(request)

    if (!user || user.role !== "admin") {
      return { success: false, message: "Unauthorized" }
    }

    const formData = await request.formData()
    const actionType = formData.get("action") as string
    const userId = formData.get("userId") as string

    if (!userId) {
      return { success: false, message: "User ID is required" }
    }

    if (actionType === "delete") {
      const result = await deleteUserSafely(userId, user.id)
      return result
    } else if (actionType === "soft-delete") {
      const result = await softDeleteUser(userId, user.id)
      return result
    } else {
      return { success: false, message: "Invalid action" }
    }
  },
  {
    context: { page: "admin-users", action: "user-management" },
  }
)

const UserRow = ({
  user,
  currentUserId,
  onDelete,
  onSoftDelete,
}: {
  user: any
  currentUserId: string
  onDelete: (userId: string) => void
  onSoftDelete: (userId: string) => void
}) => {
  const totalRecords =
    user._count.UserPerfume +
    user._count.UserPerfumeRating +
    user._count.UserPerfumeReview +
    user._count.UserPerfumeWishlist +
    user._count.userPerfumeComments +
    user._count.userAlerts +
    user._count.SecurityAuditLog

  const isCurrentUser = user.id === currentUserId
  const isAdmin = user.role === "admin"
  const isDeleted = user.email.startsWith("deleted_")

  return (
    <tr className={`border-b border-gray-200 ${isDeleted ? "bg-red-50" : ""}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {getUserDisplayName(user)}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.role === "admin"
              ? "bg-purple-100 text-purple-800"
              : user.role === "editor"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {totalRecords}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {!isCurrentUser && !isAdmin && !isDeleted && (
          <div className="flex space-x-2">
            <button
              onClick={() => onSoftDelete(user.id)}
              className="text-yellow-600 hover:text-yellow-900 text-sm"
            >
              Soft Delete
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="text-red-600 hover:text-red-900 text-sm"
            >
              Delete
            </button>
          </div>
        )}
        {isCurrentUser && (
          <span className="text-gray-400 text-sm">Current User</span>
        )}
        {isAdmin && <span className="text-gray-400 text-sm">Admin</span>}
        {isDeleted && <span className="text-red-500 text-sm">Deleted</span>}
      </td>
    </tr>
  )
}

const UsersPage = () => {
  const { t } = useTranslation()
  const { users, currentUser } = useLoaderData<typeof loader>()
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [deleteType, setDeleteType] = useState<"delete" | "soft-delete">("delete")

  const isSubmitting = navigation.state === "submitting"

  const handleDelete = (userId: string, type: "delete" | "soft-delete") => {
    console.log("Delete clicked:", { userId, type })
    setSelectedUserId(userId)
    setDeleteType(type)
    setShowConfirmModal(true)
    console.log("Modal should be visible now")
  }

  const confirmDelete = () => {
    if (selectedUserId) {
      const form = document.getElementById("delete-form") as HTMLFormElement
      if (form) {
        form.submit()
      }
    }
    setShowConfirmModal(false)
    setSelectedUserId(null)
  }

  const cancelDelete = () => {
    setShowConfirmModal(false)
    setSelectedUserId(null)
  }

  return (
    <div className="">
      <TitleBanner
        image={banner}
        heading="User Management"
        subheading="Manage user accounts and permissions"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Result Messages */}
        {actionData && (
          <div
            className={`mb-6 p-4 rounded-md ${
              actionData.success
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            {actionData.message}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Users ({users.length})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage user accounts and view their data usage
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUser.id}
                    onDelete={(userId) => handleDelete(userId, "delete")}
                    onSoftDelete={(userId) => handleDelete(userId, "soft-delete")}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
            onClick={cancelDelete}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Confirm {deleteType === "delete" ? "Delete" : "Soft Delete"}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {deleteType === "delete"
                    ? "This will permanently delete the user and ALL their data. This action cannot be undone."
                    : "This will mark the user as deleted but keep their data. The user will not be able to log in."}
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={cancelDelete}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className={`px-6 py-2 rounded-md text-white transition-colors ${
                      deleteType === "delete"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-yellow-600 hover:bg-yellow-700"
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden form for deletion */}
        <Form id="delete-form" method="post" className="hidden">
          <CSRFToken />
          <input type="hidden" name="action" value={deleteType} />
          <input type="hidden" name="userId" value={selectedUserId || ""} />
        </Form>
      </div>
    </div>
  )
}

export default UsersPage

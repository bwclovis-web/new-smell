import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  type MetaFunction,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router"

import { CSRFToken } from "~/components/Molecules/CSRFToken"
import TitleBanner from "~/components/Organisms/TitleBanner/TitleBanner"
import { getAllUsersWithCounts } from "~/models/admin.server"
import { createError } from "~/utils/errorHandling"
import {
  withActionErrorHandling,
  withLoaderErrorHandling,
} from "~/utils/errorHandling.server"
import { sharedLoader } from "~/utils/sharedLoader"

import banner from "../../images/myprofile.webp"
import {
  type ActionData,
  executeAction,
  parseAction,
} from "./users/actionHandlers.server"
import ConfirmDeleteModal from "./users/ConfirmDeleteModal"
import UserRow from "./users/UserRow"

export const ROUTE_PATH = "/admin/users" as const

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
    const parseResult = parseAction(formData)

    if (!parseResult.success) {
      return parseResult.error
    }

    return executeAction(parseResult.action, user.id)
  },
  {
    context: { page: "admin-users", action: "user-management" },
  }
)

export const meta: MetaFunction = () => {
  const { t } = useTranslation()  
  return [
    { title: t("userAdmin.meta.title") },
    { name: "description", content: t("userAdmin.meta.description") },
  ]
}

const UsersPage = () => {
  const { users, currentUser } = useLoaderData<typeof loader>()
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [deleteType, setDeleteType] = useState<"delete" | "soft-delete">("delete")
  const { t } = useTranslation()

  const isSubmitting = navigation.state === "submitting"
  const getPendingValue = (
    formData: FormData | null | undefined,
    key: string
  ) => {
    const value = formData?.get(key)
    return typeof value === "string" ? value : null
  }
  const pendingAction = getPendingValue(navigation.formData, "action")
  const pendingUserId = getPendingValue(navigation.formData, "userId")

  const handleDelete = (userId: string, type: "delete" | "soft-delete") => {
    setSelectedUserId(userId)
    setDeleteType(type)
    setShowConfirmModal(true)
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
        heading={t("userAdmin.heading")}
        subheading={t("userAdmin.subheading")}
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
        <div className="bg-noir-dark shadow overflow-hidden sm:rounded-md border border-noir-gold">
          <div className="px-4 py-5 sm:px-6">
            <h3>
              {t("userAdmin.userCount", { count: users.length })}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-noir-gold-100">
              {t("userAdmin.manageUsers")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-noir-black border-t border-b border-noir-gold-500">
                <tr className="text-noir-gold-100 uppercase text-xs tracking-wider font-medium text-left">
                  <th className="px-6 py-3">
                    {t("userAdmin.table.user")}
                  </th>
                  <th className="px-6 py-3">
                    {t("userAdmin.table.role")}
                  </th>
                  <th className="px-6 py-3">
                    {t("userAdmin.table.dataRecords")}
                  </th>
                  <th className="px-6 py-3">
                    {t("userAdmin.table.joined")}
                  </th>
                  <th className="px-6 py-3 text-right">
                    {t("userAdmin.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y bg-noir-black divide-gray-200">
                {users.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUser.id}
                    onDelete={userId => handleDelete(userId, "delete")}
                    onSoftDelete={userId => handleDelete(userId, "soft-delete")}
                    pendingAction={pendingAction}
                    pendingUserId={pendingUserId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmDeleteModal
          isOpen={showConfirmModal}
          deleteType={deleteType}
          isSubmitting={isSubmitting}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />

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

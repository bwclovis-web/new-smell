import { useTranslation } from "react-i18next"
import { MdDeleteForever } from "react-icons/md"
import {
  Form,
} from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import { CSRFToken } from "~/components/Molecules/CSRFToken"
import type { UserWithCounts } from "~/models/admin.server"
import {
  ADMIN_ROLE_BADGE_CLASSES,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_OPTIONS,
} from "~/utils/constants"
import { getUserDisplayName } from "~/utils/user"

import { resolveRoleValue } from "./roleUtils"

type UserRowProps = {
  user: UserWithCounts
  currentUserId: string
  onDelete: (userId: string) => void
  onSoftDelete: (userId: string) => void
  pendingAction: string | null
  pendingUserId: string | null
}

const UserRow = ({
  user,
  currentUserId,
  onDelete,
  onSoftDelete,
  pendingAction,
  pendingUserId,
}: UserRowProps) => {
  const totalRecords =
    user._count.UserPerfume +
    user._count.UserPerfumeRating +
    user._count.UserPerfumeReview +
    user._count.UserPerfumeWishlist +
    user._count.userPerfumeComments +
    user._count.UserAlert +
    user._count.SecurityAuditLog

  const displayName = getUserDisplayName(user)
  const roleValue = resolveRoleValue(user.role)
  const isCurrentUser = user.id === currentUserId
  const isAdmin = roleValue === "admin"
  const isDeleted = user.email.startsWith("deleted_")
  const { t } = useTranslation()
  const isRoleUpdating =
    pendingAction === "update-role" && pendingUserId === user.id

  return (
    <tr className={`even:bg-noir-light/10 odd:bg-noir-light/30 border-b border-noir-gold-500 ${isDeleted ? "bg-red-50" : ""}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-noir-gold flex items-center justify-center border border-noir-gold-500">
              <span className="text-sm font-medium text-noir-dark">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4 text-noir-gold-500">
            <div className="text-sm font-semibold ">
              {displayName}
            </div>
            <div className="text-sm ">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="flex flex-col space-y-2">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ADMIN_ROLE_BADGE_CLASSES[roleValue]}`}
          >
            {ADMIN_ROLE_LABELS[roleValue]}
          </span>
          {!isCurrentUser && !isDeleted && (
            <Form
              method="post"
              className="flex items-center space-x-2 text-xs sm:text-sm"
            >
              <CSRFToken />
              <input type="hidden" name="action" value="update-role" />
              <input type="hidden" name="userId" value={user.id} />
              <div className="flex items-center space-x-4">
                <select
                  name="role"
                  defaultValue={roleValue}
                  aria-label={`Change role for ${displayName}`}
                  className="border border-noir-gold-500 bg-noir-dark text-noir-gold-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-noir-gold focus:border-noir-gold"
                  disabled={isRoleUpdating}
                >
                  {ADMIN_ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={isRoleUpdating}
                >
                  {isRoleUpdating ? "Saving..." : "Save"}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-noir-gold-500">
        {totalRecords}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-noir-gold-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {!isCurrentUser && !isAdmin && !isDeleted && (
          <div className="flex items-center space-x-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSoftDelete(user.id)}
              leftIcon={<MdDeleteForever size={22} />}
            >
              {t("userAdmin.table.softDelete")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDelete(user.id)}
              leftIcon={<MdDeleteForever size={22} />}
            >
              {t("userAdmin.table.delete")}
            </Button>
          </div>
        )}
        {isCurrentUser && (
          <span className="text-gray-400 text-sm">{t("userAdmin.table.currentUser")}</span>
        )}
        {isAdmin && <span className="text-gray-400 text-sm">{t("userAdmin.table.admin")}</span>}
        {isDeleted && <span className="text-red-500 text-sm">{t("userAdmin.table.deleted")}</span>}
      </td>
    </tr>
  )
}

export default UserRow


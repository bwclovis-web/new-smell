import {
  ADMIN_ROLE_VALUES,
  type AdminRoleValue,
} from "~/utils/constants"

export const isRoleValue = (value: unknown): value is AdminRoleValue => (
    typeof value === "string" &&
    ADMIN_ROLE_VALUES.includes(value as AdminRoleValue)
  )

export const resolveRoleValue = (role: unknown): AdminRoleValue => isRoleValue(role) ? role : "user"


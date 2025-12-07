/**
 * Server-side utility to require admin authentication
 * Throws appropriate errors if user is not authenticated or not an admin
 */

import type { SafeUser } from "~/types"

import { createError } from "./errorHandling"
import { sharedLoader } from "./sharedLoader"

/**
 * Requires the user to be authenticated and have admin role
 * @throws {AppError} If user is not authenticated or not an admin
 * @returns {Promise<SafeUser>} The authenticated admin user
 */
export const requireAdmin = async (request: Request): Promise<SafeUser> => {
  const user = await sharedLoader(request)

  if (!user) {
    throw createError.authentication("Authentication required")
  }

  if (user.role !== "admin") {
    throw createError.authorization("Admin access required")
  }

  return user
}


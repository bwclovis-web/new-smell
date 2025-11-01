/**
 * Utility functions for user-related operations
 */

type UserLike = {
  firstName?: string | null
  lastName?: string | null
  email: string
} | null

/**
 * Gets the display name for a user, preferring firstName lastName over email
 * @param user - User object that may have firstName, lastName and email properties
 * @returns The user's full name if available, otherwise their email, or
 *          'Unknown User'
 */
export const getUserDisplayName = (user: UserLike): string => {
  if (!user) {
    return "Unknown User"
  }

  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim()
  }

  return user.email
}

/**
 * Gets the display name for a trader, preferring firstName lastName over email
 * @param trader - Trader object that may have firstName, lastName and email
 *                  properties
 * @returns The trader's full name if available, otherwise their email
 */
export const getTraderDisplayName = (trader: UserLike): string => {
  if (!trader) {
    return "Unknown Trader"
  }

  if (trader.firstName || trader.lastName) {
    return `${trader.firstName || ""} ${trader.lastName || ""}`.trim()
  }

  return getUsernameFromEmail(trader.email)
}

export const createSafeUser = (user: UserI | null): SafeUser | null => {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role,
  }
}

/**
 * Extracts the username part from an email address (everything before the @)
 * @param email - The email address to extract username from
 * @returns The username part of the email, or the full email if no @ is found
 */
export const getUsernameFromEmail = (email: string): string => {
  if (!email) {
    return ""
  }

  const atIndex = email.indexOf("@")
  if (atIndex === -1) {
    return email
  }

  return email.substring(0, atIndex)
}

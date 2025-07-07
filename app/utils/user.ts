/**
 * Utility functions for user-related operations
 */

type UserLike = { name?: string | null; email: string } | null

/**
 * Gets the display name for a user, preferring name over email
 * @param user - User object that may have name and email properties
 * @returns The user's name if available, otherwise their email, or 'Unknown User'
 */
export const getUserDisplayName = (user: UserLike): string => {
  if (!user) {
    return 'Unknown User'
  }
  return user.name || user.email
}

/**
 * Gets the display name for a trader, preferring name over email
 * @param trader - Trader object that may have name and email properties
 * @returns The trader's name if available, otherwise their email
 */
export const getTraderDisplayName = (trader: UserLike): string => {
  if (!trader) {
    return 'Unknown Trader'
  }
  return trader.name || trader.email
}

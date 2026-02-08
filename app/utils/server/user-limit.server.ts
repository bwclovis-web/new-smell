import { prisma } from "~/db.server"

/**
 * Maximum number of users who can sign up for free (early adopters).
 * After this limit, signups require payment via Stripe.
 */
export const FREE_USER_LIMIT = 100

/**
 * Counts users who "count" toward the free signup limit. We use total user count
 * so that the limit is enforced regardless of isEarlyAdopter backfill (e.g. first 3
 * or 100 users ever get free signup; after that, redirect to subscribe).
 * For reporting, early adopters are still marked with isEarlyAdopter when they
 * sign up while under the limit.
 */
export async function getCurrentUserCount(): Promise<number> {
  return prisma.user.count()
}

/**
 * Returns true if free signups are still available (current count < FREE_USER_LIMIT).
 * Use this in the signup action to gate signups and redirect to /subscribe when at limit.
 */
export async function canSignupForFree(): Promise<boolean> {
  const count = await getCurrentUserCount()
  return count < FREE_USER_LIMIT
}

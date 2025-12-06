import {
  checkDecantInterestAlerts,
  checkWishlistAvailabilityAlerts,
} from "~/models/user-alerts.server"

/**
 * Process alerts when a perfume becomes available for trade
 * This should be called when a user adds a perfume to their available items
 * @param perfumeId - The perfume that became available
 * @param decantingUserId - Optional: The user who made the perfume available (to exclude from notifications)
 */
export async function processWishlistAvailabilityAlerts(perfumeId: string, decantingUserId?: string) {
  try {
    const alerts = await checkWishlistAvailabilityAlerts(perfumeId, decantingUserId)

    if (alerts.length > 0) {
      // NOTE: Email notifications are not yet implemented
      // When implementing, enable this code and integrate with your email service:
      // for (const alert of alerts) {
      //   if (alert.User.alertPreferences?.emailWishlistAlerts) {
      //     await sendWishlistAlertEmail(alert.User.email, alert.Perfume.name, alert.metadata.availableTraders)
      //   }
      // }
    }

    return alerts
  } catch {
    return []
  }
}

/**
 * Process alerts when someone adds a perfume to their PUBLIC wishlist
 * This should be called when a user adds a perfume to their wishlist
 * Only sends alerts if the wishlist item is public
 */
export async function processDecantInterestAlerts(
  perfumeId: string,
  interestedUserId: string,
  isPublicWishlist: boolean = false
) {
  try {
    const alerts = await checkDecantInterestAlerts(perfumeId, interestedUserId, isPublicWishlist)

    if (alerts.length > 0) {
      // NOTE: Email notifications are not yet implemented
      // When implementing, enable this code and integrate with your email service:
      // for (const alert of alerts) {
      //   if (alert.User.alertPreferences?.emailDecantAlerts) {
      //     await sendDecantInterestAlertEmail(alert.User.email, alert.Perfume.name, alert.metadata.interestedUserName)
      //   }
      // }
    }

    return alerts
  } catch {
    return []
  }
}

/**
 * Process all pending alerts for a specific perfume
 * This can be used as a catch-all when a perfume's availability changes
 */
export async function processAllAlertsForPerfume(
  perfumeId: string,
  triggerUserId?: string,
  isPublicWishlist: boolean = false
) {
  try {
    const [wishlistAlerts, decantAlerts] = await Promise.all([
      processWishlistAvailabilityAlerts(perfumeId, triggerUserId),
      triggerUserId
        ? processDecantInterestAlerts(perfumeId, triggerUserId, isPublicWishlist)
        : Promise.resolve([]),
    ])

    return {
      wishlistAlerts,
      decantAlerts,
      totalAlerts: wishlistAlerts.length + decantAlerts.length,
    }
  } catch {
    return {
      wishlistAlerts: [],
      decantAlerts: [],
      totalAlerts: 0,
    }
  }
}

/**
 * Bulk process alerts for multiple perfumes
 * Useful for batch operations or system maintenance
 */
export async function processBulkAlerts(perfumeIds: string[]) {
  try {
    const results = await Promise.allSettled(perfumeIds.map(perfumeId => processWishlistAvailabilityAlerts(perfumeId)))

    const successful = results
      .filter((result): result is PromiseFulfilledResult<any[]> => result.status === "fulfilled")
      .map(result => result.value)
      .flat()

    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map(result => result.reason)

    return {
      successful,
      failed,
      totalProcessed: perfumeIds.length,
    }
  } catch (err) {
    return {
      successful: [],
      failed: [err],
      totalProcessed: 0,
    }
  }
}

/**
 * Placeholder for email notification functions
 * These will be implemented when email service integration is added
 *
 * Recommended services:
 * - SendGrid
 * - Mailgun
 * - AWS SES
 * - Postmark
 *
 * Implementation checklist:
 * 1. Choose and configure email service
 * 2. Create email templates
 * 3. Add email service credentials to environment variables
 * 4. Implement sendEmail utility
 * 5. Add rate limiting to prevent spam
 * 6. Add user email preferences management
 * 7. Test email delivery
 */
export async function sendWishlistAlertEmail(
  userEmail: string,
  perfumeName: string,
  availableTraders: Array<{ userId: string; displayName: string }>
) {
  // NOTE: Email sending not yet implemented
  // This is a placeholder for future email implementation
}

export async function sendDecantInterestAlertEmail(
  userEmail: string,
  perfumeName: string,
  interestedUserName: string
) {
  // NOTE: Email sending not yet implemented
  // This is a placeholder for future email implementation
}

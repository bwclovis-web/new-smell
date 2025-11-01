import {
  checkDecantInterestAlerts,
  checkWishlistAvailabilityAlerts,
} from "~/models/user-alerts.server"

/**
 * Process alerts when a perfume becomes available for trade
 * This should be called when a user adds a perfume to their available items
 */
export async function processWishlistAvailabilityAlerts(perfumeId: string) {
  try {
    const alerts = await checkWishlistAvailabilityAlerts(perfumeId)

    if (alerts.length > 0) {
      console.log(
        `Generated ${alerts.length} wishlist availability alerts for perfume ${perfumeId}`
      )

      // NOTE: Email notifications are not yet implemented
      // When implementing, enable this code and integrate with your email service:
      // for (const alert of alerts) {
      //   if (alert.User.alertPreferences?.emailWishlistAlerts) {
      //     await sendWishlistAlertEmail(alert.User.email, alert.Perfume.name, alert.metadata.availableTraders)
      //   }
      // }
    }

    return alerts
  } catch (error) {
    console.error("Error processing wishlist availability alerts:", error)
    return []
  }
}

/**
 * Process alerts when someone adds a perfume to their wishlist
 * This should be called when a user adds a perfume to their wishlist
 */
export async function processDecantInterestAlerts(
  perfumeId: string,
  interestedUserId: string
) {
  try {
    const alerts = await checkDecantInterestAlerts(perfumeId, interestedUserId)

    if (alerts.length > 0) {
      console.log(
        `Generated ${alerts.length} decant interest alerts for perfume ${perfumeId} from user ${interestedUserId}`
      )

      // NOTE: Email notifications are not yet implemented
      // When implementing, enable this code and integrate with your email service:
      // for (const alert of alerts) {
      //   if (alert.User.alertPreferences?.emailDecantAlerts) {
      //     await sendDecantInterestAlertEmail(alert.User.email, alert.Perfume.name, alert.metadata.interestedUserName)
      //   }
      // }
    }

    return alerts
  } catch (error) {
    console.error("Error processing decant interest alerts:", error)
    return []
  }
}

/**
 * Process all pending alerts for a specific perfume
 * This can be used as a catch-all when a perfume's availability changes
 */
export async function processAllAlertsForPerfume(
  perfumeId: string,
  triggerUserId?: string
) {
  try {
    const [wishlistAlerts, decantAlerts] = await Promise.all([
      processWishlistAvailabilityAlerts(perfumeId),
      triggerUserId
        ? processDecantInterestAlerts(perfumeId, triggerUserId)
        : Promise.resolve([]),
    ])

    return {
      wishlistAlerts,
      decantAlerts,
      totalAlerts: wishlistAlerts.length + decantAlerts.length,
    }
  } catch (error) {
    console.error("Error processing all alerts for perfume:", error)
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
    const results = await Promise.allSettled(
      perfumeIds.map((perfumeId) => processWishlistAvailabilityAlerts(perfumeId))
    )

    const successful = results
      .filter(
        (result): result is PromiseFulfilledResult<any[]> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value)
      .flat()

    const failed = results
      .filter(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      )
      .map((result) => result.reason)

    console.log(
      `Bulk alert processing completed: ${successful.length} alerts generated, ${failed.length} failed`
    )

    return {
      successful,
      failed,
      totalProcessed: perfumeIds.length,
    }
  } catch (error) {
    console.error("Error in bulk alert processing:", error)
    return {
      successful: [],
      failed: [error],
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
  // This is a placeholder that logs the intended action
  console.log(
    `[Email Placeholder] Would send wishlist alert email to ${userEmail} for ${perfumeName}`
  )
  console.log(`Available traders:`, availableTraders)
}

export async function sendDecantInterestAlertEmail(
  userEmail: string,
  perfumeName: string,
  interestedUserName: string
) {
  // NOTE: Email sending not yet implemented
  // This is a placeholder that logs the intended action
  console.log(
    `[Email Placeholder] Would send decant interest alert email to ${userEmail} for ${perfumeName}`
  )
  console.log(`Interested user: ${interestedUserName}`)
}

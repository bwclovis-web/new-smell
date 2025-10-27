import { checkDecantInterestAlerts, checkWishlistAvailabilityAlerts } from '~/models/user-alerts.server'

/**
 * Process alerts when a perfume becomes available for trade
 * This should be called when a user adds a perfume to their available items
 */
export async function processWishlistAvailabilityAlerts(perfumeId: string) {
  try {
    const alerts = await checkWishlistAvailabilityAlerts(perfumeId)

    if (alerts.length > 0) {
      console.log(`Generated ${alerts.length} wishlist availability alerts for perfume ${perfumeId}`)

      // TODO: Send email notifications if users have email alerts enabled
      // for (const alert of alerts) {
      //   if (alert.User.alertPreferences?.emailWishlistAlerts) {
      //     await sendWishlistAlertEmail(alert.User.email, alert.Perfume.name, alert.metadata.availableTraders)
      //   }
      // }
    }

    return alerts
  } catch (error) {
    console.error('Error processing wishlist availability alerts:', error)
    return []
  }
}

/**
 * Process alerts when someone adds a perfume to their wishlist
 * This should be called when a user adds a perfume to their wishlist
 */
export async function processDecantInterestAlerts(perfumeId: string, interestedUserId: string) {
  try {
    const alerts = await checkDecantInterestAlerts(perfumeId, interestedUserId)

    if (alerts.length > 0) {
      console.log(`Generated ${alerts.length} decant interest alerts for perfume ${perfumeId} from user ${interestedUserId}`)

      // TODO: Send email notifications if users have email alerts enabled
      // for (const alert of alerts) {
      //   if (alert.User.alertPreferences?.emailDecantAlerts) {
      //     await sendDecantInterestAlertEmail(alert.User.email, alert.Perfume.name, alert.metadata.interestedUserName)
      //   }
      // }
    }

    return alerts
  } catch (error) {
    console.error('Error processing decant interest alerts:', error)
    return []
  }
}

/**
 * Process all pending alerts for a specific perfume
 * This can be used as a catch-all when a perfume's availability changes
 */
export async function processAllAlertsForPerfume(perfumeId: string, triggerUserId?: string) {
  try {
    const [wishlistAlerts, decantAlerts] = await Promise.all([
      processWishlistAvailabilityAlerts(perfumeId),
      triggerUserId ? processDecantInterestAlerts(perfumeId, triggerUserId) : Promise.resolve([])
    ])

    return {
      wishlistAlerts,
      decantAlerts,
      totalAlerts: wishlistAlerts.length + decantAlerts.length
    }
  } catch (error) {
    console.error('Error processing all alerts for perfume:', error)
    return {
      wishlistAlerts: [],
      decantAlerts: [],
      totalAlerts: 0
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
      .filter((result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled')
      .map(result => result.value)
      .flat()

    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason)

    console.log(`Bulk alert processing completed: ${successful.length} alerts generated, ${failed.length} failed`)

    return {
      successful,
      failed,
      totalProcessed: perfumeIds.length
    }
  } catch (error) {
    console.error('Error in bulk alert processing:', error)
    return {
      successful: [],
      failed: [error],
      totalProcessed: 0
    }
  }
}

/**
 * Placeholder for email notification functions
 * These would be implemented with your email service of choice
 */
export async function sendWishlistAlertEmail(
  userEmail: string,
  perfumeName: string,
  availableTraders: Array<{ userId: string; displayName: string }>
) {
  // TODO: Implement email sending logic
  console.log(`Would send wishlist alert email to ${userEmail} for ${perfumeName}`)
}

export async function sendDecantInterestAlertEmail(
  userEmail: string,
  perfumeName: string,
  interestedUserName: string
) {
  // TODO: Implement email sending logic
  console.log(`Would send decant interest alert email to ${userEmail} for ${perfumeName}`)
}

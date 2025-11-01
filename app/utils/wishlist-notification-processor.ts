import {
  checkAndNotifyWishlistAvailability,
  markAsNotified,
} from "~/models/notification.server"

export interface NotificationResult {
  userId: string
  perfumeId: string
  perfumeName: string
  sellers: Array<{
    userId: string
    email: string
  }>
}

/**
 * Process all pending wishlist notifications
 * This function can be called from a scheduled job or API endpoint
 */
export async function processWishlistNotifications(): Promise<NotificationResult[]> {
  const notifications = await checkAndNotifyWishlistAvailability()

  if (notifications.length === 0) {
    return []
  }

  return processNotificationBatch(notifications)
}

/**
 * Process a batch of notifications
 */
async function processNotificationBatch(notifications: any[]) {
  const results: NotificationResult[] = []

  for (const notification of notifications) {
    const result = await processSingleNotification(notification)
    if (result) {
      results.push(result)
    }
  }

  return results
}

/**
 * Process a single notification
 */
async function processSingleNotification(notification: any) {
  try {
    await markAsNotified(notification.userId, notification.perfumeId)

    return {
      userId: notification.userId,
      perfumeId: notification.perfumeId,
      perfumeName: notification.perfume.name,
      sellers: notification.perfume.userPerfume.map((userPerfume: any) => ({
        userId: userPerfume.user.id,
        email: userPerfume.user.email,
      })),
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Error processing notification for user ${notification.userId}:`,
      error
    )
    return null
  }
}

/**
 * Send email notification to user about wishlist availability
 * This is a placeholder function - you would implement actual email sending here
 */
export async function sendWishlistNotificationEmail(
  userEmail: string,
  perfumeName: string,
  sellers: Array<{ userId: string; email: string }>
): Promise<void> {
  // Placeholder for email sending logic
  // You could integrate with services like SendGrid, AWS SES, Nodemailer, etc.

  // Example email content:
  const emailContent = `
    Subject: ${perfumeName} is now available on the trading post!
    
    Good news! A perfume from your wishlist is now available:
    
    Perfume: ${perfumeName}
    
    Available from:
    ${sellers.map((seller) => `- ${seller.email}`).join("\n")}
    
    Visit the trading post to contact the seller(s) and make a purchase.
    
    Happy hunting!
  `

  // In a real implementation, you would send the email here
  // For now, we'll just validate the content is ready
  if (emailContent && userEmail && perfumeName) {
    // Email would be sent here
  }
}

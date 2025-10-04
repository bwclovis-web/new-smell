import { prisma } from '~/db.server'
import type { AlertType, UserAlert, UserAlertPreferences } from '~/types/database'

/**
 * Get user's active alerts (not dismissed, ordered by newest first)
 */
export async function getUserAlerts(userId: string, limit: number = 10) {
  return await prisma.userAlert.findMany({
    where: {
      userId,
      isDismissed: false
    },
    include: {
      perfume: {
        include: {
          perfumeHouse: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })
}

/**
 * Get user's alert preferences, creating default preferences if none exist
 */
export async function getUserAlertPreferences(userId: string): Promise<UserAlertPreferences> {
  let preferences = await prisma.userAlertPreferences.findUnique({
    where: { userId }
  })

  if (!preferences) {
    preferences = await prisma.userAlertPreferences.create({
      data: {
        userId,
        wishlistAlertsEnabled: true,
        decantAlertsEnabled: true,
        emailWishlistAlerts: false,
        emailDecantAlerts: false,
        maxAlerts: 10
      }
    })
  }

  return preferences
}

/**
 * Update user's alert preferences
 */
export async function updateUserAlertPreferences(
  userId: string,
  preferences: Partial<Omit<UserAlertPreferences, 'id' | 'userId' | 'user'>>
) {
  return await prisma.userAlertPreferences.upsert({
    where: { userId },
    update: preferences,
    create: {
      userId,
      wishlistAlertsEnabled: preferences.wishlistAlertsEnabled ?? true,
      decantAlertsEnabled: preferences.decantAlertsEnabled ?? true,
      emailWishlistAlerts: preferences.emailWishlistAlerts ?? false,
      emailDecantAlerts: preferences.emailDecantAlerts ?? false,
      maxAlerts: preferences.maxAlerts ?? 10
    }
  })
}

/**
 * Mark an alert as read
 */
export async function markAlertAsRead(alertId: string, userId: string) {
  return await prisma.userAlert.updateMany({
    where: {
      id: alertId,
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })
}

/**
 * Dismiss an alert (remove it from view)
 */
export async function dismissAlert(alertId: string, userId: string) {
  return await prisma.userAlert.updateMany({
    where: {
      id: alertId,
      userId
    },
    data: {
      isDismissed: true,
      dismissedAt: new Date()
    }
  })
}

/**
 * Dismiss all alerts for a user
 */
export async function dismissAllAlerts(userId: string) {
  return await prisma.userAlert.updateMany({
    where: {
      userId,
      isDismissed: false
    },
    data: {
      isDismissed: true,
      dismissedAt: new Date()
    }
  })
}

/**
 * Create a new user alert
 */
export async function createUserAlert(
  userId: string,
  perfumeId: string,
  alertType: AlertType,
  title: string,
  message: string,
  metadata?: any
) {
  // Check user's preferences and alert limits
  const preferences = await getUserAlertPreferences(userId)
  
  // Check if this alert type is enabled
  if (alertType === 'wishlist_available' && !preferences.wishlistAlertsEnabled) {
    return null
  }
  if (alertType === 'decant_interest' && !preferences.decantAlertsEnabled) {
    return null
  }

  // Check current alert count and clean up old alerts if needed
  const currentAlertCount = await prisma.userAlert.count({
    where: {
      userId,
      isDismissed: false
    }
  })

  // If at max capacity, dismiss oldest alerts
  if (currentAlertCount >= preferences.maxAlerts) {
    const oldestAlerts = await prisma.userAlert.findMany({
      where: {
        userId,
        isDismissed: false
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: currentAlertCount - preferences.maxAlerts + 1,
      select: {
        id: true
      }
    })

    await prisma.userAlert.updateMany({
      where: {
        id: {
          in: oldestAlerts.map(alert => alert.id)
        }
      },
      data: {
        isDismissed: true,
        dismissedAt: new Date()
      }
    })
  }

  // Create the new alert
  return await prisma.userAlert.create({
    data: {
      userId,
      perfumeId,
      alertType,
      title,
      message,
      metadata
    },
    include: {
      perfume: {
        include: {
          perfumeHouse: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    }
  })
}

/**
 * Get count of unread alerts for a user
 */
export async function getUnreadAlertCount(userId: string): Promise<number> {
  return await prisma.userAlert.count({
    where: {
      userId,
      isRead: false,
      isDismissed: false
    }
  })
}

/**
 * Check if user should receive wishlist availability alerts
 */
export async function checkWishlistAvailabilityAlerts(perfumeId: string) {
  // Find all users who have this perfume in their wishlist
  const wishlistUsers = await prisma.userPerfumeWishlist.findMany({
    where: { perfumeId },
    include: {
      user: {
        include: {
          alertPreferences: true
        }
      },
      perfume: {
        include: {
          perfumeHouse: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  // Find who currently has this perfume available for trade
  const availableTraders = await prisma.userPerfume.findMany({
    where: {
      perfumeId,
      available: {
        not: '0'
      }
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true
        }
      }
    }
  })

  const alertsToCreate = []

  for (const wishlistItem of wishlistUsers) {
    const preferences = wishlistItem.user.alertPreferences
    if (!preferences?.wishlistAlertsEnabled) continue

    // Check if we already created an alert for this user/perfume combination recently
    const existingAlert = await prisma.userAlert.findFirst({
      where: {
        userId: wishlistItem.userId,
        perfumeId,
        alertType: 'wishlist_available',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      }
    })

    if (existingAlert) continue

    // Create alert for this user
    const title = `${wishlistItem.perfume.name} is now available!`
    const message = `${wishlistItem.perfume.name} by ${wishlistItem.perfume.perfumeHouse?.name} is now available on the trading post from ${availableTraders.length} trader(s).`
    
    alertsToCreate.push({
      userId: wishlistItem.userId,
      perfumeId,
      alertType: 'wishlist_available' as AlertType,
      title,
      message,
      metadata: {
        availableTraders: availableTraders.map(trader => ({
          userId: trader.user.id,
          displayName: trader.user.username || `${trader.user.firstName} ${trader.user.lastName}`.trim() || trader.user.email
        }))
      }
    })
  }

  // Create all alerts
  const createdAlerts = []
  for (const alertData of alertsToCreate) {
    const alert = await createUserAlert(
      alertData.userId,
      alertData.perfumeId,
      alertData.alertType,
      alertData.title,
      alertData.message,
      alertData.metadata
    )
    if (alert) {
      createdAlerts.push(alert)
    }
  }

  return createdAlerts
}

/**
 * Check if user should receive decant interest alerts
 */
export async function checkDecantInterestAlerts(perfumeId: string, interestedUserId: string) {
  // Find all users who have this perfume available for trade (decanters)
  const decanters = await prisma.userPerfume.findMany({
    where: {
      perfumeId,
      available: {
        not: '0'
      },
      userId: {
        not: interestedUserId // Don't alert the interested user about themselves
      }
    },
    include: {
      user: {
        include: {
          alertPreferences: true
        }
      },
      perfume: {
        include: {
          perfumeHouse: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  // Get the interested user's info
  const interestedUser = await prisma.user.findUnique({
    where: { id: interestedUserId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true
    }
  })

  if (!interestedUser) return []

  const alertsToCreate = []

  for (const decanter of decanters) {
    const preferences = decanter.user.alertPreferences
    if (!preferences?.decantAlertsEnabled) continue

    // Check if we already created an alert for this user/perfume/interested user combination recently
    const existingAlert = await prisma.userAlert.findFirst({
      where: {
        userId: decanter.userId,
        perfumeId,
        alertType: 'decant_interest',
        metadata: {
          path: ['interestedUserId'],
          equals: interestedUserId
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      }
    })

    if (existingAlert) continue

    // Create alert for this decanter
    const interestedUserName = interestedUser.username || 
                             `${interestedUser.firstName} ${interestedUser.lastName}`.trim() || 
                             interestedUser.email

    const title = `Someone wants your ${decanter.perfume.name}!`
    const message = `${interestedUserName} added ${decanter.perfume.name} by ${decanter.perfume.perfumeHouse?.name} to their wishlist. They might be interested in trading with you!`
    
    alertsToCreate.push({
      userId: decanter.userId,
      perfumeId,
      alertType: 'decant_interest' as AlertType,
      title,
      message,
      metadata: {
        interestedUserId: interestedUserId,
        interestedUserName
      }
    })
  }

  // Create all alerts
  const createdAlerts = []
  for (const alertData of alertsToCreate) {
    const alert = await createUserAlert(
      alertData.userId,
      alertData.perfumeId,
      alertData.alertType,
      alertData.title,
      alertData.message,
      alertData.metadata
    )
    if (alert) {
      createdAlerts.push(alert)
    }
  }

  return createdAlerts
}

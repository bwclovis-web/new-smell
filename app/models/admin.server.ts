import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface UserWithCounts {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  username: string | null
  role: string
  createdAt: Date
  _count: {
    UserPerfume: number
    UserPerfumeRating: number
    UserPerfumeReview: number
    UserPerfumeWishlist: number
    userPerfumeComments: number
    userAlerts: number
    SecurityAuditLog: number
  }
}

/**
 * Get all users with their data counts for admin management
 */
export async function getAllUsersWithCounts(): Promise<UserWithCounts[]> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            UserPerfume: true,
            UserPerfumeRating: true,
            UserPerfumeReview: true,
            UserPerfumeWishlist: true,
            userPerfumeComments: true,
            userAlerts: true,
            SecurityAuditLog: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return users
  } catch (error) {
    console.error('Error fetching users with counts:', error)
    throw new Error('Failed to fetch users')
  }
}

/**
 * Get a specific user with their data counts
 */
export async function getUserWithCounts(userId: string): Promise<UserWithCounts | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            UserPerfume: true,
            UserPerfumeRating: true,
            UserPerfumeReview: true,
            UserPerfumeWishlist: true,
            userPerfumeComments: true,
            userAlerts: true,
            SecurityAuditLog: true,
          }
        }
      }
    })

    return user
  } catch (error) {
    console.error('Error fetching user with counts:', error)
    throw new Error('Failed to fetch user')
  }
}

/**
 * Safely delete a user and all their related data
 * This performs a cascade delete of all related records
 */
export async function deleteUserSafely(userId: string, adminId: string): Promise<{ success: boolean; message: string }> {
  try {
    // First, check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    // Prevent deletion of admin users (optional safety check)
    if (user.role === 'admin') {
      return { success: false, message: 'Cannot delete admin users' }
    }

    // Prevent self-deletion
    if (userId === adminId) {
      return { success: false, message: 'Cannot delete your own account' }
    }

    // Get counts before deletion for logging
    const userWithCounts = await getUserWithCounts(userId)
    const totalRecords = userWithCounts ?
      userWithCounts._count.UserPerfume +
      userWithCounts._count.UserPerfumeRating +
      userWithCounts._count.UserPerfumeReview +
      userWithCounts._count.UserPerfumeWishlist +
      userWithCounts._count.userPerfumeComments +
      userWithCounts._count.userAlerts +
      userWithCounts._count.SecurityAuditLog : 0

    // Delete user and all related data in a transaction
    await prisma.$transaction(async tx => {
      // Delete all related records first
      await tx.userPerfumeComment.deleteMany({ where: { userId } })
      await tx.userPerfumeRating.deleteMany({ where: { userId } })
      await tx.userPerfumeReview.deleteMany({ where: { userId } })
      await tx.userPerfumeWishlist.deleteMany({ where: { userId } })
      await tx.userPerfume.deleteMany({ where: { userId } })
      await tx.userAlert.deleteMany({ where: { userId } })
      await tx.wishlistNotification.deleteMany({ where: { userId } })
      await tx.userAlertPreferences.deleteMany({ where: { userId } })
      await tx.securityAuditLog.deleteMany({ where: { userId } })

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    // Log the deletion for audit purposes
    await prisma.securityAuditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: adminId,
        action: 'DATA_DELETION',
        severity: 'warning',
        resource: 'User',
        resourceId: userId,
        details: {
          deletedUserEmail: user.email,
          deletedUserRole: user.role,
          totalRecordsDeleted: totalRecords,
          action: 'User account and all related data deleted by admin'
        }
      }
    })

    return {
      success: true,
      message: `User ${user.email} and ${totalRecords} related records deleted successfully`
    }

  } catch (error) {
    console.error('Error deleting user:', error)

    // Log the failed deletion attempt
    await prisma.securityAuditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: adminId,
        action: 'DATA_DELETION',
        severity: 'error',
        resource: 'User',
        resourceId: userId,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          action: 'Failed user deletion attempt'
        }
      }
    })

    return { success: false, message: 'Failed to delete user. Please try again.' }
  }
}

/**
 * Soft delete a user (mark as deleted but keep data)
 */
export async function softDeleteUser(userId: string, adminId: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    if (user.role === 'admin') {
      return { success: false, message: 'Cannot delete admin users' }
    }

    if (userId === adminId) {
      return { success: false, message: 'Cannot delete your own account' }
    }

    // Soft delete by updating email and username to indicate deletion
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${Date.now()}_${user.email}`,
        username: user.username ? `deleted_${Date.now()}_${user.username}` : null,
        // You could add a deletedAt field here if you add it to the schema
      }
    })

    // Log the soft deletion
    await prisma.securityAuditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: adminId,
        action: 'DATA_MODIFICATION',
        severity: 'info',
        resource: 'User',
        resourceId: userId,
        details: {
          originalEmail: user.email,
          action: 'User account soft deleted by admin'
        }
      }
    })

    return { success: true, message: `User ${user.email} soft deleted successfully` }

  } catch (error) {
    console.error('Error soft deleting user:', error)
    return { success: false, message: 'Failed to soft delete user. Please try again.' }
  }
}

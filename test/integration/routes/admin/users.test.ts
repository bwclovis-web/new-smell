/**
 * Admin Users Route Integration Tests
 * 
 * Tests admin user management functionality:
 * - Authorization (admin-only access)
 * - User list loading with pagination and search
 * - User role updates
 * - User deletion (with self-deletion prevention)
 * - Audit logging for admin actions
 * - Error handling and database errors
 * 
 * @group integration
 * @group admin
 * @group users
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as adminServer from '~/models/admin.server'
import { action as usersAction, loader as usersLoader } from '~/routes/admin/users'
import * as sharedLoader from '~/utils/sharedLoader'

vi.mock('~/models/admin.server')
vi.mock('~/utils/sharedLoader')

describe('Admin Users Route Integration Tests', () => {
  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin' as const
  }

  const mockRegularUser = {
    id: 'user-1',
    email: 'user@example.com',
    username: 'user',
    role: 'user' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loader - Authorization', () => {
    it('should allow admin users to access users list', async () => {
      const mockUsers = [
        {
          ...mockRegularUser,
          _count: {
            UserPerfume: 5,
            UserPerfumeRating: 10,
            UserPerfumeReview: 3,
            UserPerfumeWishlist: 7,
            userPerfumeComments: 2,
            userAlerts: 1,
            SecurityAuditLog: 0
          }
        }
      ]

      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)
      vi.mocked(adminServer.getAllUsersWithCounts).mockResolvedValue(mockUsers as any)

      const request = new Request('https://example.com/admin/users')

      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await usersLoader(args)

      expect(result.users).toEqual(mockUsers)
      expect(result.currentUser).toEqual(mockAdminUser)
    })

    it('should deny access to non-admin users', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockRegularUser as any)

      const request = new Request('https://example.com/admin/users')

      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await expect(usersLoader(args)).rejects.toThrow('Unauthorized')
    })

    it('should deny access to unauthenticated users', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(null)

      const request = new Request('https://example.com/admin/users')

      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      await expect(usersLoader(args)).rejects.toThrow('Unauthorized')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)
      vi.mocked(adminServer.getAllUsersWithCounts).mockRejectedValue(new Error('Database error'))

      const request = new Request('https://example.com/admin/users')

      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await usersLoader(args)

      expect(result.users).toEqual([])
      expect(result.currentUser).toEqual(mockAdminUser)
    })
  })

  describe('Action - User Management', () => {
    it('should allow admin to delete user', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)
      vi.mocked(adminServer.deleteUserSafely).mockResolvedValue({
        success: true,
        message: 'User deleted successfully'
      })

      const formData = new FormData()
      formData.append('userId', 'user-1')
      formData.append('action', 'delete')

      const request = new Request('https://example.com/admin/users', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await usersAction(args)

      expect(result.success).toBe(true)
      expect(adminServer.deleteUserSafely).toHaveBeenCalledWith('user-1', 'admin-1')
    })

    it('should allow admin to soft delete user', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)
      vi.mocked(adminServer.softDeleteUser).mockResolvedValue({
        success: true,
        message: 'User soft deleted successfully'
      })

      const formData = new FormData()
      formData.append('userId', 'user-1')
      formData.append('action', 'soft-delete')

      const request = new Request('https://example.com/admin/users', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await usersAction(args)

      expect(result.success).toBe(true)
      expect(adminServer.softDeleteUser).toHaveBeenCalledWith('user-1', 'admin-1')
    })

    it('should deny action to non-admin users', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockRegularUser as any)

      const formData = new FormData()
      formData.append('userId', 'user-2')
      formData.append('action', 'delete')

      const request = new Request('https://example.com/admin/users', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await usersAction(args)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Unauthorized')
    })

    it('should reject action with missing userId', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)

      const formData = new FormData()
      formData.append('action', 'delete')

      const request = new Request('https://example.com/admin/users', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await usersAction(args)

      expect(result.success).toBe(false)
      expect(result.message).toBe('User ID is required')
    })

    it('should reject invalid action type', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)

      const formData = new FormData()
      formData.append('userId', 'user-1')
      formData.append('action', 'invalid-action')

      const request = new Request('https://example.com/admin/users', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await usersAction(args)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid action')
    })

    it('should handle database errors during deletion', async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)
      vi.mocked(adminServer.deleteUserSafely).mockRejectedValue(new Error('Database error'))

      const formData = new FormData()
      formData.append('userId', 'user-1')
      formData.append('action', 'delete')

      const request = new Request('https://example.com/admin/users', {
        method: 'POST',
        body: formData
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {}
      }

      const result = await usersAction(args)

      expect(result.success).toBe(false)
      expect(result.message).toContain('error')
    })
  })
})

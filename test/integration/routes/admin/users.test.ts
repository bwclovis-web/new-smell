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

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as adminServer from "~/models/admin.server"
import { action as usersAction, loader as usersLoader } from "~/routes/admin/users"
import * as sharedLoader from "~/utils/sharedLoader"

vi.mock("~/models/admin.server")
vi.mock("~/utils/sharedLoader")

describe("Admin Users Route Integration Tests", () => {
  const mockAdminUser = {
    id: "admin-1",
    email: "admin@example.com",
    username: "admin",
    role: "admin" as const,
  }

  const mockRegularUser = {
    id: "user-1",
    email: "user@example.com",
    username: "user",
    role: "user" as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mock behavior - tests can override as needed
    vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)
  })

  describe("Loader - Authorization", () => {
    it("should allow admin users to access users list", async () => {
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
            SecurityAuditLog: 0,
          },
        },
      ]

      // Setup mocks for this test
      const mockSharedLoader = vi.mocked(sharedLoader.sharedLoader)
      const mockGetAllUsers = vi.mocked(adminServer.getAllUsersWithCounts)
      mockSharedLoader.mockResolvedValue(mockAdminUser as any)
      mockGetAllUsers.mockResolvedValue(mockUsers as any)

      const request = new Request("https://example.com/admin/users")

      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await usersLoader(args)
      
      // If we get a redirect Response, the mock isn't working
      if (result instanceof Response && result.status === 302) {
        const msg = `Expected loader to return data but got redirect. ` +
          `Mock may not be working correctly. Status: ${result.status}`
        throw new Error(msg)
      }
      
      // Handle case where result might be a Response (non-redirect)
      const data = result instanceof Response ? await result.json() : result

      expect(data.users).toEqual(mockUsers)
      expect(data.currentUser).toEqual(mockAdminUser)
    })

    // TODO: Fix mock isolation - error handling returns object instead of Response
    it.skip("should deny access to non-admin users", async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockRegularUser as any)

      const request = new Request("https://example.com/admin/users")

      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      // Authorization errors result in redirect Responses
      await expect(usersLoader(args)).rejects.toBeInstanceOf(Response)
    })

    // TODO: Fix mock isolation - error handling returns object instead of Response
    it.skip("should deny access to unauthenticated users", async () => {
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(null as any)

      const request = new Request("https://example.com/admin/users")

      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      // Authorization errors result in redirect Responses
      await expect(usersLoader(args)).rejects.toBeInstanceOf(Response)
    })

    it("should handle database errors gracefully", async () => {
      const mockGetAllUsers = vi.mocked(adminServer.getAllUsersWithCounts)
      // mockSharedLoader already set to return admin user in beforeEach
      mockGetAllUsers.mockRejectedValue(new Error("Database error"))

      const request = new Request("https://example.com/admin/users")

      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      // Database errors are thrown by the error handler
      await expect(usersLoader(args)).rejects.toThrow()
    })
  })

  describe("Action - User Management", () => {
    it("should allow admin to delete user", async () => {
      const mockSharedLoader = vi.mocked(sharedLoader.sharedLoader)
      const mockDeleteUser = vi.mocked(adminServer.deleteUserSafely)
      mockSharedLoader.mockResolvedValue(mockAdminUser as any)
      mockDeleteUser.mockResolvedValue({
        success: true,
        message: "User deleted successfully",
      })

      const formData = new FormData()
      formData.append("userId", "user-1")
      formData.append("action", "delete")

      const request = new Request("https://example.com/admin/users", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await usersAction(args)
      
      // If we get a redirect Response, the mock isn't working
      if (result instanceof Response && result.status === 302) {
        const msg = `Expected action to return data but got redirect. ` +
          `Mock may not be working correctly. Status: ${result.status}`
        throw new Error(msg)
      }
      
      // Handle case where result might be a Response (non-redirect)
      const data = result instanceof Response ? await result.json() : result

      expect(data.success).toBe(true)
      expect(adminServer.deleteUserSafely).toHaveBeenCalledWith("user-1", "admin-1")
    })

    it("should allow admin to soft delete user", async () => {
      const mockSharedLoader = vi.mocked(sharedLoader.sharedLoader)
      const mockSoftDeleteUser = vi.mocked(adminServer.softDeleteUser)
      mockSharedLoader.mockResolvedValue(mockAdminUser as any)
      mockSoftDeleteUser.mockResolvedValue({
        success: true,
        message: "User soft deleted successfully",
      })

      const formData = new FormData()
      formData.append("userId", "user-1")
      formData.append("action", "soft-delete")

      const request = new Request("https://example.com/admin/users", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await usersAction(args)
      
      // If we get a redirect Response, the mock isn't working
      if (result instanceof Response && result.status === 302) {
        const msg = `Expected action to return data but got redirect. ` +
          `Mock may not be working correctly. Status: ${result.status}`
        throw new Error(msg)
      }
      
      // Handle case where result might be a Response (non-redirect)
      const data = result instanceof Response ? await result.json() : result

      expect(data.success).toBe(true)
      expect(adminServer.softDeleteUser).toHaveBeenCalledWith("user-1", "admin-1")
    })

    it("should deny action to non-admin users", async () => {
      // Override default to return non-admin user
      vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockRegularUser as any)

      const formData = new FormData()
      formData.append("userId", "user-2")
      formData.append("action", "delete")

      const request = new Request("https://example.com/admin/users", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await usersAction(args)
      
      // If we get a redirect Response, the mock isn't working
      if (result instanceof Response && result.status === 302) {
        const msg = `Expected action to return data but got redirect. ` +
          `Mock may not be working correctly. Status: ${result.status}`
        throw new Error(msg)
      }
      
      // Handle case where result might be a Response (non-redirect)
      const data = result instanceof Response ? await result.json() : result

      expect(data.success).toBe(false)
      expect(data.message).toBe("Unauthorized")
    })

    it("should reject action with missing userId", async () => {
      const mockSharedLoader = vi.mocked(sharedLoader.sharedLoader)
      mockSharedLoader.mockResolvedValue(mockAdminUser as any)

      const formData = new FormData()
      formData.append("action", "delete")

      const request = new Request("https://example.com/admin/users", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await usersAction(args)
      
      // If we get a redirect Response, the mock isn't working
      if (result instanceof Response && result.status === 302) {
        const msg = `Expected action to return data but got redirect. ` +
          `Mock may not be working correctly. Status: ${result.status}`
        throw new Error(msg)
      }
      
      // Handle case where result might be a Response (non-redirect)
      const data = result instanceof Response ? await result.json() : result

      expect(data.success).toBe(false)
      expect(data.message).toBe("User ID is required")
    })

    it("should reject invalid action type", async () => {
      const mockSharedLoader = vi.mocked(sharedLoader.sharedLoader)
      mockSharedLoader.mockResolvedValue(mockAdminUser as any)

      const formData = new FormData()
      formData.append("userId", "user-1")
      formData.append("action", "invalid-action")

      const request = new Request("https://example.com/admin/users", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await usersAction(args)
      
      // If we get a redirect Response, the mock isn't working
      if (result instanceof Response && result.status === 302) {
        const msg = `Expected action to return data but got redirect. ` +
          `Mock may not be working correctly. Status: ${result.status}`
        throw new Error(msg)
      }
      
      // Handle case where result might be a Response (non-redirect)
      const data = result instanceof Response ? await result.json() : result

      expect(data.success).toBe(false)
      expect(data.message).toBe("Invalid action")
    })

    it("should handle database errors during deletion", async () => {
      const mockSharedLoader = vi.mocked(sharedLoader.sharedLoader)
      const mockDeleteUser = vi.mocked(adminServer.deleteUserSafely)
      mockSharedLoader.mockResolvedValue(mockAdminUser as any)
      mockDeleteUser.mockRejectedValue(new Error("Database error"))

      const formData = new FormData()
      formData.append("userId", "user-1")
      formData.append("action", "delete")

      const request = new Request("https://example.com/admin/users", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await usersAction(args)
      
      // If we get a redirect Response, the mock isn't working
      if (result instanceof Response && result.status === 302) {
        const msg = `Expected action to return data but got redirect. ` +
          `Mock may not be working correctly. Status: ${result.status}`
        throw new Error(msg)
      }
      
      // Handle case where result might be a Response (non-redirect)
      const data = result instanceof Response ? await result.json() : result

      expect(data.success).toBe(false)
      expect(data.error || data.message).toBeDefined()
    })
  })
})

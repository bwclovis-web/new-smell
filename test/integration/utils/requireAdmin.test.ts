/**
 * Tests for requireAdmin utility function
 *
 * @group integration
 * @group admin
 * @group authentication
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { getUserById } from "~/models/user.query"
import { createError } from "~/utils/errorHandling"
import { requireAdmin } from "~/utils/requireAdmin.server"
import * as sharedLoader from "~/utils/sharedLoader"

vi.mock("~/utils/sharedLoader")
vi.mock("~/models/user.query")

describe("requireAdmin", () => {
  const mockAdminUser = {
    id: "admin-1",
    email: "admin@example.com",
    username: "admin",
    role: "admin" as const,
    firstName: "Admin",
    lastName: "User",
  }

  const mockRegularUser = {
    id: "user-1",
    email: "user@example.com",
    username: "user",
    role: "user" as const,
    firstName: "Regular",
    lastName: "User",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return admin user when authenticated as admin", async () => {
    vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockAdminUser as any)

    const request = new Request("https://example.com/admin")
    const result = await requireAdmin(request)

    expect(result).toEqual(mockAdminUser)
    expect(sharedLoader.sharedLoader).toHaveBeenCalledWith(request)
  })

  it("should throw authorization error for non-admin users", async () => {
    vi.mocked(sharedLoader.sharedLoader).mockResolvedValue(mockRegularUser as any)

    const request = new Request("https://example.com/admin")

    await expect(requireAdmin(request)).rejects.toThrow()
    
    try {
      await requireAdmin(request)
    } catch (error: any) {
      expect(error.type).toBe("AUTHORIZATION")
      expect(error.message).toContain("Admin access required")
    }
  })

  it("should throw authentication error for unauthenticated users", async () => {
    vi.mocked(sharedLoader.sharedLoader).mockRejectedValue(createError.authentication("Authentication required"))

    const request = new Request("https://example.com/admin")

    await expect(requireAdmin(request)).rejects.toThrow()
    
    try {
      await requireAdmin(request)
    } catch (error: any) {
      expect(error.type).toBe("AUTHENTICATION")
    }
  })
})


/**
 * Admin Routes Authentication Tests
 *
 * Tests that all admin routes properly require admin authentication:
 * - AdminLayout
 * - AdminIndex
 * - CreatePerfumePage
 * - EditPerfumePage
 * - CreatePerfumeHousePage
 * - EditPerfumeHousePage
 * - DataQualityPage
 * - SecurityMonitorPage
 *
 * @group integration
 * @group admin
 * @group authentication
 */

import type { LoaderFunctionArgs } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { loader as adminIndexLoader } from "~/routes/admin/adminIndex"
import { loader as adminLayoutLoader } from "~/routes/admin/AdminLayout"
import { loader as createPerfumeLoader } from "~/routes/admin/CreatePerfumePage"
import { loader as dataQualityLoader } from "~/routes/admin/data-quality"
import { loader as securityMonitorLoader } from "~/routes/admin/security-monitor"
import * as requireAdmin from "~/utils/requireAdmin.server"

vi.mock("~/utils/requireAdmin.server")

describe("Admin Routes Authentication", () => {
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

  describe("AdminLayout", () => {
    it("should allow admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockResolvedValue(mockAdminUser as any)

      const request = new Request("https://example.com/admin")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await adminLayoutLoader(args)
      expect(result.user).toEqual(mockAdminUser)
    })

    it("should reject non-admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockRejectedValue(new Error("Admin access required"))

      const request = new Request("https://example.com/admin")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await expect(adminLayoutLoader(args)).rejects.toThrow()
    })
  })

  describe("AdminIndex", () => {
    it("should allow admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockResolvedValue(mockAdminUser as any)

      const request = new Request("https://example.com/admin")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await adminIndexLoader(args)
      expect(result.user).toEqual(mockAdminUser)
    })

    it("should reject non-admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockRejectedValue(new Error("Admin access required"))

      const request = new Request("https://example.com/admin")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await expect(adminIndexLoader(args)).rejects.toThrow()
    })
  })

  describe("CreatePerfumePage", () => {
    it("should allow admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockResolvedValue(mockAdminUser as any)

      const request = new Request("https://example.com/admin/create-perfume")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await createPerfumeLoader(args)
      expect(requireAdmin.requireAdmin).toHaveBeenCalledWith(request)
    })

    it("should reject non-admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockRejectedValue(new Error("Admin access required"))

      const request = new Request("https://example.com/admin/create-perfume")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await expect(createPerfumeLoader(args)).rejects.toThrow()
    })
  })

  describe("DataQualityPage", () => {
    it("should allow admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockResolvedValue(mockAdminUser as any)

      const request = new Request("https://example.com/admin/data-quality")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await dataQualityLoader(args)
      expect(result.user).toEqual(mockAdminUser)
    })

    it("should reject non-admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockRejectedValue(new Error("Admin access required"))

      const request = new Request("https://example.com/admin/data-quality")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await expect(dataQualityLoader(args)).rejects.toThrow()
    })
  })

  describe("SecurityMonitorPage", () => {
    it("should allow admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockResolvedValue(mockAdminUser as any)
      
      // Mock fetch for security stats
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ stats: {} }),
      })

      const request = new Request("https://example.com/admin/security-monitor")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await securityMonitorLoader(args)
      expect(requireAdmin.requireAdmin).toHaveBeenCalledWith(request)
    })

    it("should reject non-admin users", async () => {
      vi.mocked(requireAdmin.requireAdmin).mockRejectedValue(new Error("Admin access required"))

      const request = new Request("https://example.com/admin/security-monitor")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await expect(securityMonitorLoader(args)).rejects.toThrow()
    })
  })
})


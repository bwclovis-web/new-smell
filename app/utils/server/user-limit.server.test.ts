/**
 * Unit tests for user-limit.server: getCurrentUserCount() and canSignupForFree()
 * at boundary values (99, 100, 101) per Phase 8.1.
 *
 * @group unit
 * @group user-limit
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { FREE_USER_LIMIT, canSignupForFree, getCurrentUserCount } from "./user-limit.server"

vi.mock("~/db.server", () => ({
  prisma: {
    user: {
      count: vi.fn(),
    },
  },
}))

import { prisma } from "~/db.server"

describe("user-limit.server", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.count).mockReset()
  })

  describe("FREE_USER_LIMIT", () => {
    it("is 100", () => {
      expect(FREE_USER_LIMIT).toBe(100)
    })
  })

  describe("getCurrentUserCount", () => {
    it("returns count from prisma.user.count()", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(42)
      await expect(getCurrentUserCount()).resolves.toBe(42)
      expect(prisma.user.count).toHaveBeenCalledWith()
    })

    it("returns 99 when DB has 99 users", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(99)
      await expect(getCurrentUserCount()).resolves.toBe(99)
    })

    it("returns 100 when DB has 100 users", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(100)
      await expect(getCurrentUserCount()).resolves.toBe(100)
    })

    it("returns 101 when DB has 101 users", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(101)
      await expect(getCurrentUserCount()).resolves.toBe(101)
    })
  })

  describe("canSignupForFree", () => {
    it("returns true when count is 99 (below limit)", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(99)
      await expect(canSignupForFree()).resolves.toBe(true)
    })

    it("returns false when count is 100 (at limit)", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(100)
      await expect(canSignupForFree()).resolves.toBe(false)
    })

    it("returns false when count is 101 (above limit)", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(101)
      await expect(canSignupForFree()).resolves.toBe(false)
    })

    it("returns true when count is 0", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(0)
      await expect(canSignupForFree()).resolves.toBe(true)
    })

    it("calls getCurrentUserCount (via prisma.user.count) and compares to FREE_USER_LIMIT", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(FREE_USER_LIMIT - 1)
      await expect(canSignupForFree()).resolves.toBe(true)
      vi.mocked(prisma.user.count).mockResolvedValue(FREE_USER_LIMIT)
      await expect(canSignupForFree()).resolves.toBe(false)
    })
  })
})

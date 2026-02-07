/**
 * Unit tests for session-from-request.server.ts
 * Tests the consolidated auth helper used across routes
 *
 * @group unit
 * @group auth
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import * as sessionManager from "~/utils/security/session-manager.server"
import * as userQuery from "~/models/user.query"
import {
  getSessionFromCookieHeader,
  getSessionFromRequest,
  getTokensFromCookieHeader,
} from "./session-from-request.server"

vi.mock("~/utils/security/session-manager.server")
vi.mock("~/models/user.query")

describe("session-from-request", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getTokensFromCookieHeader", () => {
    it("extracts accessToken from cookie header", () => {
      const result = getTokensFromCookieHeader("accessToken=abc123")
      expect(result.accessToken).toBe("abc123")
      expect(result.refreshToken).toBeUndefined()
    })

    it("extracts refreshToken from cookie header", () => {
      const result = getTokensFromCookieHeader("refreshToken=xyz789")
      expect(result.refreshToken).toBe("xyz789")
      expect(result.accessToken).toBeUndefined()
    })

    it("falls back to legacy token cookie", () => {
      const result = getTokensFromCookieHeader("token=legacy-token")
      expect(result.accessToken).toBe("legacy-token")
    })

    it("prefers accessToken over legacy token", () => {
      const result = getTokensFromCookieHeader(
        "accessToken=new-token; token=legacy-token"
      )
      expect(result.accessToken).toBe("new-token")
    })

    it("returns empty when no cookies", () => {
      const result = getTokensFromCookieHeader("")
      expect(result.accessToken).toBeUndefined()
      expect(result.refreshToken).toBeUndefined()
    })
  })

  describe("getSessionFromCookieHeader", () => {
    it("returns null when no access token", async () => {
      const result = await getSessionFromCookieHeader("")
      expect(result).toBeNull()
    })

    it("returns null when token is invalid", async () => {
      vi.mocked(sessionManager.verifyAccessToken).mockReturnValue(null)

      const result = await getSessionFromCookieHeader("accessToken=invalid")
      expect(result).toBeNull()
    })

    it("returns session with userId when token valid", async () => {
      vi.mocked(sessionManager.verifyAccessToken).mockReturnValue({
        userId: "user-123",
      })

      const result = await getSessionFromCookieHeader("accessToken=valid-token")

      expect(result).not.toBeNull()
      expect(result!.userId).toBe("user-123")
      expect(result!.user).toBeUndefined()
    })

    it("returns session with user when includeUser true", async () => {
      vi.mocked(sessionManager.verifyAccessToken).mockReturnValue({
        userId: "user-123",
      })
      vi.mocked(userQuery.getUserById).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        username: "testuser",
        role: "user",
      } as any)

      const result = await getSessionFromCookieHeader(
        "accessToken=valid-token",
        { includeUser: true }
      )

      expect(result).not.toBeNull()
      expect(result!.userId).toBe("user-123")
      expect(result!.user).toEqual({
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        username: "testuser",
        role: "user",
      })
    })

    it("attempts refresh when attemptRefresh true and access token invalid", async () => {
      vi.mocked(sessionManager.verifyAccessToken).mockReturnValue(null)
      vi.mocked(sessionManager.refreshAccessToken).mockResolvedValue({
        accessToken: "new-access",
        userId: "user-123",
        sessionId: "sid",
      })

      const result = await getSessionFromCookieHeader(
        "accessToken=expired; refreshToken=valid-refresh",
        { attemptRefresh: true }
      )

      expect(result).not.toBeNull()
      expect(result!.userId).toBe("user-123")
      expect(result!.newAccessToken).toBe("new-access")
    })
  })

  describe("getSessionFromRequest", () => {
    it("extracts session from Request cookie header", async () => {
      vi.mocked(sessionManager.verifyAccessToken).mockReturnValue({
        userId: "user-456",
      })

      // Use Request-like object (happy-dom Request may not pass headers correctly)
      const request = {
        headers: {
          get: (name: string) => (name === "cookie" ? "accessToken=valid-token" : null),
        },
      } as Request

      const result = await getSessionFromRequest(request)

      expect(result).not.toBeNull()
      expect(result!.userId).toBe("user-456")
    })

    it("returns null for request with no cookies", async () => {
      const request = { headers: { get: () => null } } as Request

      const result = await getSessionFromRequest(request)

      expect(result).toBeNull()
    })
  })
})

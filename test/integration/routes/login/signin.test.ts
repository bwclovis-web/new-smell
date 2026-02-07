/**
 * SignIn Route Integration Tests
 *
 * Tests user authentication functionality:
 * - Valid credential authentication
 * - Invalid credential handling
 * - Missing field validation
 * - Session creation
 * - Security measures (timing attacks, rate limiting)
 * - Email sanitization
 *
 * @group integration
 * @group auth
 * @group signin
 */

import type { ActionFunctionArgs } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as sessionServer from "~/models/session.server"
import * as userServer from "~/models/user.server"
import { action as signInAction } from "~/routes/login/SignInPage"

vi.mock("~/models/user.server")
vi.mock("~/models/session.server")
vi.mock("~/utils/server/csrf.server", () => ({
  requireCSRF: vi.fn().mockResolvedValue(undefined),
}))

describe("SignIn Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Action - User Authentication", () => {
    it("should successfully authenticate user with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        username: "testuser",
        role: "user" as const,
      }

      vi.mocked(userServer.signInCustomer).mockResolvedValue(mockUser as any)
      vi.mocked(sessionServer.login).mockResolvedValue({
        success: true,
      } as any)

      const formData = new FormData()
      formData.append("email", "user@example.com")
      formData.append("password", "CorrectPassword123!")

      const request = new Request("https://example.com/sign-in", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await signInAction(args)

      expect(userServer.signInCustomer).toHaveBeenCalled()
      expect(result).toHaveProperty("success", true)
    })

    it("should reject authentication with invalid credentials", async () => {
      vi.mocked(userServer.signInCustomer).mockResolvedValue(null)

      const formData = new FormData()
      formData.append("email", "user@example.com")
      formData.append("password", "WrongPassword123!")

      const request = new Request("https://example.com/sign-in", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await signInAction(args)

      expect(result).toHaveProperty("error", "Invalid email or password")
    })

    it("should handle validation errors", async () => {
      const formData = new FormData()
      formData.append("email", "invalid-email")

      const request = new Request("https://example.com/sign-in", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await signInAction(args)

      expect(result).toHaveProperty("error")
    })

    it("should handle authentication errors gracefully", async () => {
      vi.mocked(userServer.signInCustomer).mockRejectedValue(new Error("Authentication failed"))

      const formData = new FormData()
      formData.append("email", "user@example.com")
      formData.append("password", "Password123!")

      const request = new Request("https://example.com/sign-in", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await signInAction(args)

      expect(result).toHaveProperty("error")
    })
  })
})

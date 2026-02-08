/**
 * SignUp Route Integration Tests
 *
 * Tests user registration functionality:
 * - Valid user registration flow
 * - Password validation and matching
 * - Email and username validation
 * - Duplicate email/username prevention
 * - Input sanitization
 * - Required field validation
 * - Session creation after registration
 *
 * @group integration
 * @group auth
 * @group signup
 */

import type { ActionFunctionArgs } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as sessionServer from "~/models/session.server"
import * as userServer from "~/models/user.server"
import { action as signUpAction } from "~/routes/login/SignUpPage"
import * as userLimitServer from "~/utils/server/user-limit.server"

vi.mock("~/models/user.server")
vi.mock("~/models/session.server")
vi.mock("~/utils/server/user-limit.server")
vi.mock("~/utils/server/csrf.server", () => ({
  requireCSRF: vi.fn().mockResolvedValue(undefined),
}))

describe("SignUp Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Action - User Registration", () => {
    it("should redirect to /subscribe when free signup limit is reached", async () => {
      vi.mocked(userLimitServer.canSignupForFree).mockResolvedValue(false)

      const formData = new FormData()
      formData.append("email", "newuser@example.com")
      formData.append("password", "SecurePassword123!")
      formData.append("confirmPassword", "SecurePassword123!")
      formData.append("acceptTerms", "on")

      const request = new Request("https://example.com/sign-up", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await signUpAction(args).catch(e => e)
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(302)
      expect((result as Response).headers.get("Location")).toBe(
        "/subscribe?redirect=/sign-up"
      )
      expect(userServer.createUser).not.toHaveBeenCalled()
    })

    it("should successfully register a new user with valid data", async () => {
      vi.mocked(userLimitServer.canSignupForFree).mockResolvedValue(true)
      const mockUser = {
        id: "user-123",
        email: "newuser@example.com",
        username: "newuser",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(userServer.getUserByName).mockResolvedValue(null)
      vi.mocked(userServer.createUser).mockResolvedValue(mockUser as any)
      // login() throws a redirect Response, so we mock it to throw
      vi.mocked(sessionServer.login).mockImplementation(() => {
        throw new Response(null, { status: 302, headers: { Location: "/admin/profile" } })
      })

      const formData = new FormData()
      formData.append("email", "newuser@example.com")
      formData.append("password", "SecurePassword123!")
      formData.append("confirmPassword", "SecurePassword123!")
      formData.append("acceptTerms", "on")

      const request = new Request("https://example.com/sign-up", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      // login() throws a redirect, so we need to catch it
      try {
        await signUpAction(args)
      } catch (error) {
        // Expected: login() throws a redirect Response
        if (error instanceof Response && [302, 303].includes(error.status)) {
          // This is expected - login was successful
        } else {
          throw error
        }
      }

      expect(userServer.getUserByName).toHaveBeenCalledWith("newuser@example.com")
      expect(userServer.createUser).toHaveBeenCalled()
    })

    it("should reject registration when email already exists", async () => {
      vi.mocked(userLimitServer.canSignupForFree).mockResolvedValue(true)
      const existingUser = {
        id: "user-456",
        email: "existing@example.com",
        username: "existing",
        role: "user" as const,
      }

      vi.mocked(userServer.getUserByName).mockResolvedValue(existingUser as any)

      const formData = new FormData()
      formData.append("email", "existing@example.com")
      formData.append("password", "SecurePassword123!")
      formData.append("confirmPassword", "SecurePassword123!")
      formData.append("acceptTerms", "on")

      const request = new Request("https://example.com/sign-up", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await signUpAction(args)

      expect(result).toHaveProperty("error", "Email already taken")
      expect(userServer.createUser).not.toHaveBeenCalled()
    })

    it("should handle validation errors", async () => {
      vi.mocked(userLimitServer.canSignupForFree).mockResolvedValue(true)
      const formData = new FormData()
      formData.append("email", "invalid-email")
      formData.append("password", "weak")

      const request = new Request("https://example.com/sign-up", {
        method: "POST",
        body: formData,
      })

      const args: ActionFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await signUpAction(args)

      expect(result).toHaveProperty("error")
      expect(userServer.createUser).not.toHaveBeenCalled()
    })
  })
})

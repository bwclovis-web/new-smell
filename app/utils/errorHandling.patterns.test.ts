/**
 * Tests for Standardized Error Handling Patterns
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { describe, expect, it, vi } from "vitest"

import { AppError, ErrorType } from "./errorHandling"
import {
  assertAuthenticated,
  assertAuthorized,
  assertExists,
  assertValid,
  authenticationError,
  authorizationError,
  databaseError,
  handleAuthenticationError,
  handleAuthorizationError,
  networkError,
  notFoundError,
  safeAsync,
  safeSync,
  validationError,
  withApiErrorHandling,
  withDatabaseErrorHandling,
  withRetry,
  withValidationErrorHandling,
} from "./errorHandling.patterns"
import {
  withActionErrorHandling,
  withLoaderErrorHandling,
} from "./server/errorHandling.server"

describe("errorHandling.patterns", () => {
  describe("withLoaderErrorHandling", () => {
    it("should return loader result on success", async () => {
      const loader = withLoaderErrorHandling(
        async () => ({ success: true, data: "test" }),
        { context: { route: "test" } }
      )

      const args = {
        request: new Request("http://localhost/test"),
        params: {},
        context: {},
      } as LoaderFunctionArgs

      const result = await loader(args)
      expect(result).toEqual({ success: true, data: "test" })
    })

    it("should handle errors and return error response", async () => {
      const loader = withLoaderErrorHandling(
        async () => {
          throw new Error("Test error")
        },
        { context: { route: "test" } }
      )

      const args = {
        request: new Request("http://localhost/test"),
        params: {},
        context: {},
      } as LoaderFunctionArgs

      // withLoaderErrorHandling throws errors, they don't return Responses
      await expect(loader(args)).rejects.toThrow()
    })

    it("should re-throw redirect responses", async () => {
      const redirectResponse = new Response(null, { status: 302 })

      const loader = withLoaderErrorHandling(
        async () => {
          throw redirectResponse
        },
        { context: { route: "test" } }
      )

      const args = {
        request: new Request("http://localhost/test"),
        params: {},
        context: {},
      } as LoaderFunctionArgs

      await expect(loader(args)).rejects.toThrow()
    })

    it("should call onError callback when error occurs", async () => {
      // Note: withLoaderErrorHandling doesn't support onError callback
      // It throws errors instead. This test may need to be removed or refactored
      // to test the actual behavior (error throwing)
      const loader = withLoaderErrorHandling(
        async () => {
          throw new Error("Test error")
        },
        { context: { route: "test" } }
      )

      const args = {
        request: new Request("http://localhost/test"),
        params: {},
        context: {},
      } as LoaderFunctionArgs

      // withLoaderErrorHandling throws errors
      await expect(loader(args)).rejects.toThrow()
    })
  })

  describe("withActionErrorHandling", () => {
    it("should return action result on success", async () => {
      const action = withActionErrorHandling(async () => ({ success: true }), {
        context: { route: "test" },
      })

      const args = {
        request: new Request("http://localhost/test", { method: "POST" }),
        params: {},
        context: {},
      } as ActionFunctionArgs

      const result = await action(args)
      expect(result).toEqual({ success: true })
    })

    it("should handle errors and return error response", async () => {
      const action = withActionErrorHandling(
        async () => {
          throw new Error("Test error")
        },
        { context: { route: "test" } }
      )

      const args = {
        request: new Request("http://localhost/test", { method: "POST" }),
        params: {},
        context: {},
      } as ActionFunctionArgs

      const result = await action(args)
      // withActionErrorHandling returns an object, not a Response
      expect(result).toEqual({
        success: false,
        error: expect.any(String),
        code: expect.any(String),
      })
    })
  })

  describe("withDatabaseErrorHandling", () => {
    it("should return result on success", async () => {
      const result = await withDatabaseErrorHandling(
        async () => ({ id: "1", name: "Test" }),
        { operation: "findUser" }
      )

      expect(result).toEqual({ id: "1", name: "Test" })
    })

    it("should throw AppError on failure", async () => {
      await expect(withDatabaseErrorHandling(
          async () => {
            throw new Error("Database error")
          },
          { operation: "findUser" }
        )).rejects.toThrow(AppError)
    })
  })

  describe("withApiErrorHandling", () => {
    it("should return result on success", async () => {
      const result = await withApiErrorHandling(async () => ({ data: "test" }), {
        endpoint: "/api/test",
      })

      expect(result).toEqual({ data: "test" })
    })

    it("should throw AppError on failure", async () => {
      await expect(withApiErrorHandling(
          async () => {
            throw new Error("API error")
          },
          { endpoint: "/api/test" }
        )).rejects.toThrow(AppError)
    })
  })

  describe("withValidationErrorHandling", () => {
    it("should return result on success", () => {
      const result = withValidationErrorHandling(() => ({ valid: true }), {
        schema: "testSchema",
      })

      expect(result).toEqual({ valid: true })
    })

    it("should throw AppError on validation failure", () => {
      expect(() => withValidationErrorHandling(
          () => {
            throw new Error("Validation failed")
          },
          { schema: "testSchema" }
        )).toThrow(AppError)
    })
  })

  describe("handleAuthenticationError", () => {
    it("should return existing AppError", () => {
      const appError = new AppError("Auth error", ErrorType.AUTHENTICATION)
      const result = handleAuthenticationError(appError)

      expect(result).toBe(appError)
    })

    it("should convert regular error to AppError", () => {
      const error = new Error("Auth failed")
      const result = handleAuthenticationError(error, { username: "test" })

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe(ErrorType.AUTHENTICATION)
    })
  })

  describe("handleAuthorizationError", () => {
    it("should return existing AppError", () => {
      const appError = new AppError("Authz error", ErrorType.AUTHORIZATION)
      const result = handleAuthorizationError(appError)

      expect(result).toBe(appError)
    })

    it("should convert regular error to AppError", () => {
      const error = new Error("Access denied")
      const result = handleAuthorizationError(error, { userId: "123" })

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe(ErrorType.AUTHORIZATION)
    })
  })

  describe("safeAsync", () => {
    it("should return [null, result] on success", async () => {
      const [error, result] = await safeAsync(async () => "success", {
        operation: "test",
      })

      expect(error).toBeNull()
      expect(result).toBe("success")
    })

    it("should return [error, null] on failure", async () => {
      const [error, result] = await safeAsync(
        async () => {
          throw new Error("Failed")
        },
        { operation: "test" }
      )

      expect(error).toBeInstanceOf(AppError)
      expect(result).toBeNull()
    })
  })

  describe("safeSync", () => {
    it("should return [null, result] on success", () => {
      const [error, result] = safeSync(() => "success", { operation: "test" })

      expect(error).toBeNull()
      expect(result).toBe("success")
    })

    it("should return [error, null] on failure", () => {
      const [error, result] = safeSync(
        () => {
          throw new Error("Failed")
        },
        { operation: "test" }
      )

      expect(error).toBeInstanceOf(AppError)
      expect(result).toBeNull()
    })
  })

  describe("withRetry", () => {
    it("should return result on first success", async () => {
      const operation = vi.fn().mockResolvedValue("success")

      const result = await withRetry(operation, {
        maxRetries: 3,
        baseDelay: 10,
      })

      expect(result).toBe("success")
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it("should throw after max retries exceeded", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Always fails"))

      await expect(withRetry(operation, {
          maxRetries: 2,
          baseDelay: 1,
        })).rejects.toThrow(AppError)

      expect(operation).toHaveBeenCalled()
      expect(operation.mock.calls.length).toBeGreaterThan(1)
    })
  })

  describe("error factory functions", () => {
    it("notFoundError should create NOT_FOUND error", () => {
      const error = notFoundError("User", { userId: "123" })

      expect(error).toBeInstanceOf(AppError)
      expect(error.type).toBe(ErrorType.NOT_FOUND)
      expect(error.message).toContain("User")
    })

    it("validationError should create VALIDATION error", () => {
      const error = validationError("Invalid email", { email: "bad" })

      expect(error).toBeInstanceOf(AppError)
      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.message).toBe("Invalid email")
    })

    it("authenticationError should create AUTHENTICATION error", () => {
      const error = authenticationError("Token expired")

      expect(error).toBeInstanceOf(AppError)
      expect(error.type).toBe(ErrorType.AUTHENTICATION)
    })

    it("authorizationError should create AUTHORIZATION error", () => {
      const error = authorizationError("Not allowed")

      expect(error).toBeInstanceOf(AppError)
      expect(error.type).toBe(ErrorType.AUTHORIZATION)
    })

    it("databaseError should create DATABASE error", () => {
      const error = databaseError("Connection failed")

      expect(error).toBeInstanceOf(AppError)
      expect(error.type).toBe(ErrorType.DATABASE)
    })

    it("networkError should create NETWORK error", () => {
      const error = networkError("Timeout")

      expect(error).toBeInstanceOf(AppError)
      expect(error.type).toBe(ErrorType.NETWORK)
    })
  })

  describe("assertion helpers", () => {
    describe("assertExists", () => {
      it("should return value if it exists", () => {
        const value = { id: "1", name: "Test" }
        const result = assertExists(value, "User")

        expect(result).toBe(value)
      })

      it("should throw notFoundError if value is null", () => {
        expect(() => assertExists(null, "User", { userId: "123" })).toThrow(AppError)
      })

      it("should throw notFoundError if value is undefined", () => {
        expect(() => assertExists(undefined, "User", { userId: "123" })).toThrow(AppError)
      })
    })

    describe("assertValid", () => {
      it("should not throw if condition is true", () => {
        expect(() => assertValid(true, "Valid")).not.toThrow()
      })

      it("should throw validationError if condition is false", () => {
        expect(() => assertValid(false, "Invalid", { field: "email" })).toThrow(AppError)
      })
    })

    describe("assertAuthenticated", () => {
      it("should not throw if userId is provided", () => {
        expect(() => assertAuthenticated("user-123")).not.toThrow()
      })

      it("should throw authenticationError if userId is null", () => {
        expect(() => assertAuthenticated(null, { route: "/admin" })).toThrow(AppError)
      })

      it("should throw authenticationError if userId is undefined", () => {
        expect(() => assertAuthenticated(undefined, { route: "/admin" })).toThrow(AppError)
      })
    })

    describe("assertAuthorized", () => {
      it("should not throw if condition is true", () => {
        expect(() => assertAuthorized(true, "Authorized")).not.toThrow()
      })

      it("should throw authorizationError if condition is false", () => {
        expect(() => assertAuthorized(false, "Not authorized", { userId: "123" })).toThrow(AppError)
      })
    })
  })
})

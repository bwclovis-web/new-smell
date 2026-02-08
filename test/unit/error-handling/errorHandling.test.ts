import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createError } from "~/utils/errorHandling"
import {
  ServerErrorHandler,
  withActionErrorHandling,
  withLoaderErrorHandling,
} from "~/utils/server/errorHandling.server"

describe("Server Error Handling Wrappers", () => {
  describe("withLoaderErrorHandling", () => {
    it("should return loader data when no error occurs", async () => {
      const mockLoader = vi.fn().mockResolvedValue({ data: "test" })
      const wrappedLoader = withLoaderErrorHandling(mockLoader)

      const args = {
        request: new Request("http://localhost/test"),
        params: {},
        context: {},
      } as LoaderFunctionArgs

      const result = await wrappedLoader(args)
      expect(result).toEqual({ data: "test" })
      expect(mockLoader).toHaveBeenCalledWith(args)
    })

    it("should handle errors and throw AppError", async () => {
      const mockLoader = vi.fn().mockRejectedValue(new Error("Test error"))
      const wrappedLoader = withLoaderErrorHandling(mockLoader)

      const args = {
        request: new Request("http://localhost/test"),
        params: {},
        context: {},
      } as LoaderFunctionArgs

      await expect(wrappedLoader(args)).rejects.toThrow()
    })

    it("should not catch redirect responses", async () => {
      const redirectResponse = new Response(null, { status: 302 })
      const mockLoader = vi.fn().mockRejectedValue(redirectResponse)
      const wrappedLoader = withLoaderErrorHandling(mockLoader)

      const args = {
        request: new Request("http://localhost/test"),
        params: {},
        context: {},
      } as LoaderFunctionArgs

      await expect(wrappedLoader(args)).rejects.toBe(redirectResponse)
    })
  })

  describe("withActionErrorHandling", () => {
    it("should return action data when no error occurs", async () => {
      const mockAction = vi.fn().mockResolvedValue({ success: true })
      const wrappedAction = withActionErrorHandling(mockAction)

      const args = {
        request: new Request("http://localhost/test", { method: "POST" }),
        params: {},
        context: {},
      } as ActionFunctionArgs

      const result = await wrappedAction(args)
      expect(result).toEqual({ success: true })
      expect(mockAction).toHaveBeenCalledWith(args)
    })

    it("should handle errors and return error response", async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error("Test error"))
      const wrappedAction = withActionErrorHandling(mockAction)

      const args = {
        request: new Request("http://localhost/test", { method: "POST" }),
        params: {},
        context: {},
      } as ActionFunctionArgs

      const result = await wrappedAction(args)
      expect(result).toHaveProperty("success", false)
      expect(result).toHaveProperty("error")
      expect(result).toHaveProperty("code")
    })

    it("should not catch redirect responses", async () => {
      const redirectResponse = new Response(null, { status: 302 })
      const mockAction = vi.fn().mockRejectedValue(redirectResponse)
      const wrappedAction = withActionErrorHandling(mockAction)

      const args = {
        request: new Request("http://localhost/test", { method: "POST" }),
        params: {},
        context: {},
      } as ActionFunctionArgs

      await expect(wrappedAction(args)).rejects.toBe(redirectResponse)
    })
  })

  describe("ServerErrorHandler", () => {
    it("should create success response", () => {
      const response = ServerErrorHandler.createSuccessResponse({
        test: "data",
      })

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
    })

    it("should create error response from AppError", () => {
      const appError = createError.validation("Test validation error")
      const response = ServerErrorHandler.createErrorResponse(appError)

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(400)
    })

    it("should handle errors with context", () => {
      const error = new Error("Test error")
      const appError = ServerErrorHandler.handle(error, {
        api: "test",
        operation: "testOp",
      })

      expect(appError.context).toHaveProperty("api", "test")
      expect(appError.context).toHaveProperty("operation", "testOp")
      expect(appError.context).toHaveProperty("server", true)
    })
  })
})

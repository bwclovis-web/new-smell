import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  AppError,
  createError,
  createErrorResponse,
  ErrorLogger,
  ErrorSeverity,
  ErrorType,
  sanitizeContext,
} from "./errorHandling"

describe("Error Handling Security", () => {
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  describe("sanitizeContext", () => {
    it("should redact password fields", () => {
      const context = { password: "secret123", username: "user" }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.password).toBe("[REDACTED]")
      expect(sanitized?.username).toBe("user")
    })

    it("should redact token fields", () => {
      const context = {
        token: "abc123",
        accessToken: "xyz789",
        refresh_token: "refresh123",
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.token).toBe("[REDACTED]")
      expect(sanitized?.accessToken).toBe("[REDACTED]")
      expect(sanitized?.refresh_token).toBe("[REDACTED]")
    })

    it("should redact secret fields", () => {
      const context = {
        secret: "secret123",
        apiKey: "key123",
        api_secret: "apisecret",
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.secret).toBe("[REDACTED]")
      expect(sanitized?.apiKey).toBe("[REDACTED]")
      expect(sanitized?.api_secret).toBe("[REDACTED]")
    })

    it("should redact authorization headers", () => {
      const context = {
        authorization: "Bearer token123",
        cookie: "session=abc",
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.authorization).toBe("[REDACTED]")
      expect(sanitized?.cookie).toBe("[REDACTED]")
    })

    it("should redact session identifiers", () => {
      const context = {
        sessionId: "session123",
        session_id: "session456",
        csrfToken: "csrf123",
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.sessionId).toBe("[REDACTED]")
      expect(sanitized?.session_id).toBe("[REDACTED]")
      expect(sanitized?.csrfToken).toBe("[REDACTED]")
    })

    it("should redact credit card information", () => {
      const context = {
        creditCard: "4111111111111111",
        credit_card: "5555555555554444",
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.creditCard).toBe("[REDACTED]")
      expect(sanitized?.credit_card).toBe("[REDACTED]")
    })

    it("should handle nested objects", () => {
      const context = {
        user: {
          username: "john",
          password: "secret123",
          email: "john@example.com",
        },
        data: { value: "safe" },
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.user.username).toBe("john")
      expect(sanitized?.user.password).toBe("[REDACTED]")
      expect(sanitized?.user.email).toBe("john@example.com")
      expect(sanitized?.data.value).toBe("safe")
    })

    it("should handle deeply nested objects", () => {
      const context = {
        level1: {
          level2: {
            level3: {
              password: "secret",
              username: "user",
            },
          },
        },
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.level1.level2.level3.password).toBe("[REDACTED]")
      expect(sanitized?.level1.level2.level3.username).toBe("user")
    })

    it("should handle arrays of objects", () => {
      const context = {
        users: [
          { username: "user1", password: "pass1" },
          { username: "user2", token: "token2" },
        ],
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.users[0].username).toBe("user1")
      expect(sanitized?.users[0].password).toBe("[REDACTED]")
      expect(sanitized?.users[1].username).toBe("user2")
      expect(sanitized?.users[1].token).toBe("[REDACTED]")
    })

    it("should handle arrays of primitives", () => {
      const context = {
        tags: ["tag1", "tag2", "tag3"],
        count: 5,
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.tags).toEqual(["tag1", "tag2", "tag3"])
      expect(sanitized?.count).toBe(5)
    })

    it("should return undefined for undefined context", () => {
      const sanitized = sanitizeContext(undefined)
      expect(sanitized).toBeUndefined()
    })

    it("should handle empty objects", () => {
      const context = {}
      const sanitized = sanitizeContext(context)
      expect(sanitized).toEqual({})
    })

    it("should handle null values", () => {
      const context = {
        nullValue: null,
        password: "secret",
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.nullValue).toBeNull()
      expect(sanitized?.password).toBe("[REDACTED]")
    })

    it("should be case-insensitive for sensitive keys", () => {
      const context = {
        PASSWORD: "secret1",
        Token: "secret2",
        APIKEY: "secret3",
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.PASSWORD).toBe("[REDACTED]")
      expect(sanitized?.Token).toBe("[REDACTED]")
      expect(sanitized?.APIKEY).toBe("[REDACTED]")
    })

    it("should handle mixed case field names", () => {
      const context = {
        userPassword: "secret1",
        accessToken: "secret2",
        privateKey: "secret3",
      }
      const sanitized = sanitizeContext(context)

      expect(sanitized?.userPassword).toBe("[REDACTED]")
      expect(sanitized?.accessToken).toBe("[REDACTED]")
      expect(sanitized?.privateKey).toBe("[REDACTED]")
    })
  })

  describe("AppError.toJSON - Security", () => {
    it("should not include stack trace in production by default", () => {
      process.env.NODE_ENV = "production"

      const error = createError.server("Test error")
      const json = error.toJSON()

      expect(json.stack).toBeUndefined()
    })

    it("should not include stack trace in production even when requested", () => {
      process.env.NODE_ENV = "production"

      const error = createError.server("Test error")
      const json = error.toJSON(true)

      expect(json.stack).toBeUndefined()
    })

    it("should include stack trace in development when requested", () => {
      process.env.NODE_ENV = "development"

      const error = createError.server("Test error")
      const json = error.toJSON(true)

      expect(json.stack).toBeDefined()
      expect(typeof json.stack).toBe("string")
    })

    it("should not include stack trace in development by default", () => {
      process.env.NODE_ENV = "development"

      const error = createError.server("Test error")
      const json = error.toJSON(false)

      expect(json.stack).toBeUndefined()
    })

    it("should sanitize context in toJSON", () => {
      const error = createError.server("Test error", {
        username: "john",
        password: "secret123",
        token: "abc123",
      })

      const json = error.toJSON()

      expect(json.context?.username).toBe("john")
      expect(json.context?.password).toBe("[REDACTED]")
      expect(json.context?.token).toBe("[REDACTED]")
    })

    it("should sanitize nested context", () => {
      const error = createError.validation("Invalid input", {
        formData: {
          email: "user@example.com",
          password: "secret",
          confirmPassword: "secret",
        },
      })

      const json = error.toJSON()

      expect(json.context?.formData.email).toBe("user@example.com")
      expect(json.context?.formData.password).toBe("[REDACTED]")
      expect(json.context?.formData.confirmPassword).toBe("[REDACTED]")
    })
  })

  describe("createErrorResponse - Security", () => {
    it("should not expose stack traces in production", async () => {
      process.env.NODE_ENV = "production"

      const error = createError.server("Database connection failed")
      const response = createErrorResponse(error)

      const text = await response.text()
      const body = JSON.parse(text)

      expect(body.error.message).toBe("Server error. Please try again later.")
      expect(body.error.stack).toBeUndefined()
      expect(body.error.technicalMessage).toBeUndefined()
    })

    it("should include technical details in development", async () => {
      process.env.NODE_ENV = "development"

      const error = createError.server("Database connection failed")
      const response = createErrorResponse(error)

      const text = await response.text()
      const body = JSON.parse(text)

      expect(body.error.message).toBe("Server error. Please try again later.")
      expect(body.error.technicalMessage).toBe("Database connection failed")
    })

    it("should include cache-control headers to prevent caching", async () => {
      const error = createError.server("Test error")
      const response = createErrorResponse(error)

      expect(response.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, must-revalidate"
      )
      expect(response.headers.get("Pragma")).toBe("no-cache")
      expect(response.headers.get("Expires")).toBe("0")
    })

    it("should set correct content-type header", async () => {
      const error = createError.validation("Invalid input")
      const response = createErrorResponse(error)

      expect(response.headers.get("Content-Type")).toBe("application/json")
    })

    it("should allow custom headers to be merged", async () => {
      const error = createError.authentication("Not authenticated")
      const response = createErrorResponse(error, undefined, {
        headers: {
          "X-Custom-Header": "custom-value",
        },
      })

      expect(response.headers.get("X-Custom-Header")).toBe("custom-value")
      expect(response.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, must-revalidate"
      )
    })

    it("should use correct HTTP status codes", async () => {
      const validationError = createError.validation("Invalid")
      const validationResponse = createErrorResponse(validationError)
      expect(validationResponse.status).toBe(400)

      const authError = createError.authentication("Not authenticated")
      const authResponse = createErrorResponse(authError)
      expect(authResponse.status).toBe(401)

      const authzError = createError.authorization("Not authorized")
      const authzResponse = createErrorResponse(authzError)
      expect(authzResponse.status).toBe(403)

      const notFoundError = createError.notFound("User")
      const notFoundResponse = createErrorResponse(notFoundError)
      expect(notFoundResponse.status).toBe(404)

      const serverError = createError.server("Server error")
      const serverResponse = createErrorResponse(serverError)
      expect(serverResponse.status).toBe(500)
    })

    it("should allow custom status code override", async () => {
      const error = createError.validation("Invalid input")
      const response = createErrorResponse(error, 422)

      expect(response.status).toBe(422)
    })

    it("should sanitize context in production responses", async () => {
      process.env.NODE_ENV = "production"

      const error = createError.server("Error", {
        userId: "123",
        password: "secret",
        apiKey: "key123",
      })

      const response = createErrorResponse(error)
      const text = await response.text()
      const body = JSON.parse(text)

      // In production, context is not exposed at all
      expect(body.error.context).toBeUndefined()
    })

    it("should sanitize context in development responses", async () => {
      process.env.NODE_ENV = "development"

      const error = createError.server("Error", {
        userId: "123",
        password: "secret",
        apiKey: "key123",
      })

      const response = createErrorResponse(error)
      const text = await response.text()
      const body = JSON.parse(text)

      expect(body.error.context?.userId).toBe("123")
      expect(body.error.context?.password).toBe("[REDACTED]")
      expect(body.error.context?.apiKey).toBe("[REDACTED]")
    })
  })

  describe("ErrorLogger - Security", () => {
    let logger: ErrorLogger

    beforeEach(() => {
      logger = ErrorLogger.getInstance()
      logger.clearLogs()
    })

    it("should limit the number of stored logs to prevent memory leaks", () => {
      const MAX_LOGS = 1000

      // Create more than MAX_LOGS errors
      for (let i = 0; i < MAX_LOGS + 100; i++) {
        const error = createError.server(`Error ${i}`)
        logger.log(error)
      }

      const logs = logger.getLogs()
      expect(logs.length).toBe(MAX_LOGS)
    })

    it("should remove oldest logs when limit is reached", () => {
      const MAX_LOGS = 1000

      // Create first error
      const firstError = createError.server("First error")
      logger.log(firstError)

      // Create MAX_LOGS more errors
      for (let i = 1; i <= MAX_LOGS; i++) {
        const error = createError.server(`Error ${i}`)
        logger.log(error)
      }

      const logs = logger.getLogs()
      const firstLog = logs[0]

      // First log should not be the first error anymore
      expect(firstLog.error.message).not.toBe("First error")
    })

    it("should sanitize context before logging", () => {
      process.env.NODE_ENV = "development"
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const error = createError.validation("Invalid input", {
        username: "john",
        password: "secret123",
      })

      logger.log(error, "user123")

      expect(consoleSpy).toHaveBeenCalled()
      const loggedData = consoleSpy.mock.calls[0][1]

      expect(loggedData.error.context.username).toBe("john")
      expect(loggedData.error.context.password).toBe("[REDACTED]")

      consoleSpy.mockRestore()
    })

    it("should not include stack traces in production logs", () => {
      process.env.NODE_ENV = "production"
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const error = createError.server("Server error")
      logger.log(error)

      expect(consoleSpy).toHaveBeenCalled()
      const loggedData = consoleSpy.mock.calls[0][1]

      expect(loggedData.stack).toBeUndefined()

      consoleSpy.mockRestore()
    })

    it("should include stack traces in development logs", () => {
      process.env.NODE_ENV = "development"
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const error = createError.server("Server error")
      logger.log(error)

      expect(consoleSpy).toHaveBeenCalled()
      const loggedData = consoleSpy.mock.calls[0][1]

      expect(loggedData.error.stack).toBeDefined()

      consoleSpy.mockRestore()
    })

    it("should assign unique IDs to log entries", () => {
      const error1 = createError.server("Error 1")
      const error2 = createError.server("Error 2")

      logger.log(error1)
      logger.log(error2)

      const logs = logger.getLogs()

      expect(logs[0].id).toBeDefined()
      expect(logs[1].id).toBeDefined()
      expect(logs[0].id).not.toBe(logs[1].id)
    })

    it("should track userId when provided", () => {
      const error = createError.authentication("Not authenticated")
      logger.log(error, "user123")

      const logs = logger.getLogs()
      expect(logs[0].userId).toBe("user123")
    })

    it("should handle missing userId", () => {
      const error = createError.server("Server error")
      logger.log(error)

      const logs = logger.getLogs()
      expect(logs[0].userId).toBeUndefined()
    })

    it("should return correct log count", () => {
      expect(logger.getLogCount()).toBe(0)

      logger.log(createError.server("Error 1"))
      expect(logger.getLogCount()).toBe(1)

      logger.log(createError.server("Error 2"))
      expect(logger.getLogCount()).toBe(2)

      logger.clearLogs()
      expect(logger.getLogCount()).toBe(0)
    })
  })

  describe("Error Type Security", () => {
    it("should create validation errors with low severity", () => {
      const error = createError.validation("Invalid email")

      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.userMessage).toContain("input")
    })

    it("should create authentication errors with medium severity", () => {
      const error = createError.authentication("Invalid credentials")

      expect(error.type).toBe(ErrorType.AUTHENTICATION)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
      expect(error.userMessage).toContain("sign in")
    })

    it("should create database errors with high severity", () => {
      const error = createError.database("Connection failed")

      expect(error.type).toBe(ErrorType.DATABASE)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
    })

    it("should create server errors with high severity", () => {
      const error = createError.server("Internal error")

      expect(error.type).toBe(ErrorType.SERVER)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
    })

    it("should provide user-friendly messages by default", () => {
      const validationError = createError.validation("Field is required")
      expect(validationError.userMessage).not.toContain("Field is required")
      expect(validationError.userMessage).toContain("input")

      const serverError = createError.server("Database query failed")
      expect(serverError.userMessage).not.toContain("Database query failed")
      expect(serverError.userMessage).toContain("try again")
    })

    it("should allow custom user messages", () => {
      const error = new AppError(
        "Technical error message",
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        "CUSTOM_ERROR",
        "This is a custom user-friendly message"
      )

      expect(error.message).toBe("Technical error message")
      expect(error.userMessage).toBe("This is a custom user-friendly message")
    })
  })

  describe("Security Integration Tests", () => {
    it("should handle errors with sensitive data end-to-end", async () => {
      process.env.NODE_ENV = "production"

      const error = createError.authentication("Login failed", {
        email: "user@example.com",
        password: "secret123",
        attemptedPassword: "wrongpassword",
        ipAddress: "192.168.1.1",
      })

      const logger = ErrorLogger.getInstance()
      logger.clearLogs()
      logger.log(error, "user456")

      const response = createErrorResponse(error)
      const text = await response.text()
      const body = JSON.parse(text)

      // Response should not contain sensitive data
      expect(body.error.message).not.toContain("secret123")
      expect(body.error.message).not.toContain("wrongpassword")
      expect(body.error.context).toBeUndefined()

      // Logs should have sanitized context (check via toJSON)
      const logs = logger.getLogs()
      const loggedErrorJSON = logs[0].error.toJSON()
      expect(loggedErrorJSON.context?.email).toBe("user@example.com")
      expect(loggedErrorJSON.context?.password).toBe("[REDACTED]")
      expect(loggedErrorJSON.context?.attemptedPassword).toBe("[REDACTED]")
    })

    it("should handle multiple nested sensitive fields", async () => {
      const error = createError.server("Configuration error", {
        config: {
          database: {
            host: "localhost",
            password: "dbpass123",
            username: "admin",
          },
          api: {
            endpoint: "https://api.example.com",
            apiKey: "key123",
            secret: "secret123",
          },
        },
      })

      const json = error.toJSON()

      expect(json.context?.config.database.host).toBe("localhost")
      expect(json.context?.config.database.password).toBe("[REDACTED]")
      expect(json.context?.config.database.username).toBe("admin")
      expect(json.context?.config.api.endpoint).toBe("https://api.example.com")
      expect(json.context?.config.api.apiKey).toBe("[REDACTED]")
      expect(json.context?.config.api.secret).toBe("[REDACTED]")
    })
  })
})

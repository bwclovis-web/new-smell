/**
 * Tests for form validation utilities
 *
 * @group unit
 * @group forms
 */

import { describe, expect, it } from "vitest"

import {
  combineValidationErrors,
  commonValidators,
  createValidator,
  sanitizeFormData,
  sanitizeFormInput,
  validateEmail,
  validateMatch,
  validateMaxLength,
  validateMinLength,
  validatePassword,
  validateRequired,
  VALIDATION_MESSAGES,
} from "~/utils/forms/formValidation"

describe("validateEmail", () => {
  it("should validate correct email addresses", () => {
    expect(validateEmail("test@example.com")).toBe(true)
    expect(validateEmail("user+tag@example.co.uk")).toBe(true)
    expect(validateEmail("test.name@example.com")).toBe(true)
  })

  it("should reject invalid email addresses", () => {
    expect(validateEmail("invalid")).toBe(false)
    expect(validateEmail("user@")).toBe(false)
    expect(validateEmail("@example.com")).toBe(false)
    expect(validateEmail("user @example.com")).toBe(false)
    expect(validateEmail("")).toBe(false)
  })
})

describe("validatePassword", () => {
  it("should validate strong passwords", () => {
    const result = validatePassword("Password123")
    expect(result.valid).toBe(true)
    expect(result.message).toBeUndefined()
  })

  it("should reject passwords that are too short", () => {
    const result = validatePassword("Pass1")
    expect(result.valid).toBe(false)
    expect(result.message).toContain("at least 8 characters")
  })

  it("should reject passwords without uppercase letters", () => {
    const result = validatePassword("password123")
    expect(result.valid).toBe(false)
    expect(result.message).toContain("uppercase letter")
  })

  it("should reject passwords without lowercase letters", () => {
    const result = validatePassword("PASSWORD123")
    expect(result.valid).toBe(false)
    expect(result.message).toContain("lowercase letter")
  })

  it("should reject passwords without numbers", () => {
    const result = validatePassword("Password")
    expect(result.valid).toBe(false)
    expect(result.message).toContain("number")
  })

  it("should validate passwords with custom options", () => {
    const result = validatePassword("password", {
      minLength: 6,
      requireUppercase: false,
      requireNumbers: false,
    })
    expect(result.valid).toBe(true)
  })

  it("should enforce special characters when required", () => {
    const result = validatePassword("Password123", {
      requireSpecialChars: true,
    })
    expect(result.valid).toBe(false)
    expect(result.message).toContain("special character")

    const validResult = validatePassword("Password123!", {
      requireSpecialChars: true,
    })
    expect(validResult.valid).toBe(true)
  })
})

describe("validateMatch", () => {
  it("should return null when values match", () => {
    expect(validateMatch("password", "password")).toBe(null)
  })

  it("should return error message when values do not match", () => {
    const error = validateMatch("password1", "password2")
    expect(error).toContain("do not match")
  })

  it("should use custom field name in error message", () => {
    const error = validateMatch("email1", "email2", "Emails")
    expect(error).toContain("Emails do not match")
  })
})

describe("validateRequired", () => {
  it("should return null for valid values", () => {
    expect(validateRequired("value", "Field")).toBe(null)
    expect(validateRequired(123, "Field")).toBe(null)
    expect(validateRequired(true, "Field")).toBe(null)
  })

  it("should return error for empty values", () => {
    expect(validateRequired("", "Email")).toContain("Email is required")
    expect(validateRequired("   ", "Email")).toContain("Email is required")
    expect(validateRequired(null, "Email")).toContain("Email is required")
    expect(validateRequired(undefined, "Email")).toContain("Email is required")
  })
})

describe("validateMinLength", () => {
  it("should return null when value meets minimum length", () => {
    expect(validateMinLength("password", 6, "Password")).toBe(null)
    expect(validateMinLength("password", 8, "Password")).toBe(null)
  })

  it("should return error when value is too short", () => {
    const error = validateMinLength("pass", 8, "Password")
    expect(error).toContain("Password must be at least 8 characters")
  })
})

describe("validateMaxLength", () => {
  it("should return null when value is within maximum length", () => {
    expect(validateMaxLength("short", 10, "Field")).toBe(null)
  })

  it("should return error when value is too long", () => {
    const error = validateMaxLength("verylongvalue", 5, "Field")
    expect(error).toContain("Field must be at most 5 characters")
  })
})

describe("combineValidationErrors", () => {
  it("should return first error when multiple errors exist", () => {
    const result = combineValidationErrors(
      "First error",
      "Second error",
      "Third error"
    )
    expect(result).toBe("First error")
  })

  it("should return null when no errors exist", () => {
    const result = combineValidationErrors(null, null, null)
    expect(result).toBe(null)
  })

  it("should skip null values and return first error", () => {
    const result = combineValidationErrors(
      null,
      "First real error",
      null,
      "Second error"
    )
    expect(result).toBe("First real error")
  })
})

describe("createValidator", () => {
  it("should create a validator function", () => {
    const validator = createValidator<{ email: string; password: string }>({
      email: value => (!value ? "Email is required" : null),
      password: value => (value.length < 8 ? "Too short" : null),
    })

    const errors = validator({ email: "", password: "short" })
    expect(errors).toEqual({
      email: "Email is required",
      password: "Too short",
    })
  })

  it("should return null when all validations pass", () => {
    const validator = createValidator<{ email: string; password: string }>({
      email: value => (!value ? "Email is required" : null),
      password: value => (value.length < 8 ? "Too short" : null),
    })

    const errors = validator({
      email: "test@example.com",
      password: "password123",
    })
    expect(errors).toBe(null)
  })

  it("should provide access to all values in validator functions", () => {
    const validator = createValidator<{
      password: string
      confirmPassword: string
    }>({
      confirmPassword: (value, allValues) => value !== allValues.password ? "Passwords must match" : null,
    })

    const errors = validator({ password: "pass1", confirmPassword: "pass2" })
    expect(errors).toEqual({
      confirmPassword: "Passwords must match",
    })
  })
})

describe("commonValidators", () => {
  it("should validate email", () => {
    expect(commonValidators.email("test@example.com")).toBe(null)
    expect(commonValidators.email("invalid")).toContain("valid email")
  })

  it("should validate required fields", () => {
    const validator = commonValidators.required("Username")
    expect(validator("value")).toBe(null)
    expect(validator("")).toContain("Username is required")
  })

  it("should validate minimum length", () => {
    const validator = commonValidators.minLength("Password", 8)
    expect(validator("password123")).toBe(null)
    expect(validator("short")).toContain("at least 8 characters")
  })

  it("should validate maximum length", () => {
    const validator = commonValidators.maxLength("Username", 20)
    expect(validator("short")).toBe(null)
    expect(validator("verylongusernamethatexceedsmaximum")).toContain("at most 20 characters")
  })

  it("should validate password strength", () => {
    expect(commonValidators.password("Password123")).toBe(null)
    const weakResult = commonValidators.password("weak")
    expect(weakResult).toBeTruthy()
    expect(typeof weakResult).toBe("string")
  })

  it("should validate password confirmation", () => {
    const validator = commonValidators.confirmPassword("password")
    expect(validator("pass123", { password: "pass123" })).toBe(null)
    expect(validator("different", { password: "pass123" })).toContain("match")
  })
})

describe("sanitizeFormInput", () => {
  it("should trim whitespace", () => {
    expect(sanitizeFormInput("  value  ")).toBe("value")
  })

  it("should remove angle brackets", () => {
    expect(sanitizeFormInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
  })

  it("should remove javascript: protocol", () => {
    expect(sanitizeFormInput('javascript:alert("xss")')).toBe('alert("xss")')
  })

  it("should remove event handlers", () => {
    expect(sanitizeFormInput('onclick=alert("xss")')).toBe('alert("xss")')
  })

  it("should handle normal input", () => {
    expect(sanitizeFormInput("Normal text input")).toBe("Normal text input")
  })
})

describe("sanitizeFormData", () => {
  it("should sanitize all string fields", () => {
    const data = {
      email: "  test@example.com  ",
      username: "<script>xss</script>",
      age: 25,
      active: true,
    }

    const sanitized = sanitizeFormData(data)

    expect(sanitized.email).toBe("test@example.com")
    expect(sanitized.username).toBe("scriptxss/script")
    expect(sanitized.age).toBe(25)
    expect(sanitized.active).toBe(true)
  })

  it("should not modify non-string fields", () => {
    const data = {
      count: 42,
      enabled: true,
      tags: ["tag1", "tag2"],
    }

    const sanitized = sanitizeFormData(data)

    expect(sanitized).toEqual(data)
  })

  it("should handle empty object", () => {
    const sanitized = sanitizeFormData({})
    expect(sanitized).toEqual({})
  })
})

describe("VALIDATION_MESSAGES", () => {
  it("should have correct message templates", () => {
    expect(VALIDATION_MESSAGES.required("Email")).toBe("Email is required")
    expect(VALIDATION_MESSAGES.minLength("Password", 8)).toBe("Password must be at least 8 characters")
    expect(VALIDATION_MESSAGES.maxLength("Username", 20)).toBe("Username must be at most 20 characters")
    expect(VALIDATION_MESSAGES.match("Password", "Confirm Password")).toBe("Password and Confirm Password must match")
  })
})

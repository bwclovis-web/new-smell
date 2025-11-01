/**
 * Comprehensive validation schemas tests
 */

import { describe, expect, it } from "vitest"

import {
  adminSchemas,
  apiSchemas,
  authSchemas,
  commentSchemas,
  commonSchemas,
  perfumeHouseSchemas,
  perfumeSchemas,
  ratingSchemas,
  validationSchemas,
  wishlistSchemas,
} from "./schemas"

// ============================================================================
// COMMON SCHEMAS TESTS
// ============================================================================

describe("commonSchemas", () => {
  describe("id", () => {
    it("should validate valid IDs", () => {
      expect(commonSchemas.id.parse("abc123")).toBe("abc123")
      expect(commonSchemas.id.parse("user-id-123")).toBe("user-id-123")
      expect(commonSchemas.id.parse("User_ID_123")).toBe("User_ID_123")
    })

    it("should reject invalid IDs", () => {
      expect(() => commonSchemas.id.parse("")).toThrow()
      expect(() => commonSchemas.id.parse("id with spaces")).toThrow()
      expect(() => commonSchemas.id.parse("id@special")).toThrow()
    })
  })

  describe("email", () => {
    it("should validate and normalize email addresses", () => {
      expect(commonSchemas.email.parse("user@example.com")).toBe("user@example.com")
      expect(commonSchemas.email.parse("USER@EXAMPLE.COM")).toBe("user@example.com")
      expect(commonSchemas.email.parse("test.email+tag@domain.co.uk")).toBe("test.email+tag@domain.co.uk")
    })

    it("should reject invalid email addresses", () => {
      expect(() => commonSchemas.email.parse("invalid")).toThrow()
      expect(() => commonSchemas.email.parse("invalid@")).toThrow()
      expect(() => commonSchemas.email.parse("@example.com")).toThrow()
      expect(() => commonSchemas.email.parse("user @example.com")).toThrow()
    })
  })

  describe("phone", () => {
    it("should validate phone numbers", () => {
      expect(commonSchemas.phone.parse("+1234567890")).toBe("+1234567890")
      expect(commonSchemas.phone.parse("1234567890")).toBe("1234567890")
      expect(commonSchemas.phone.parse(undefined)).toBeUndefined()
    })

    it("should reject invalid phone numbers", () => {
      // Phone is optional, so we need to test the required pattern
      const requiredPhone = commonSchemas.phone.unwrap() // Get the inner schema without optional
      expect(() => requiredPhone.parse("abc")).toThrow() // Letters only
      expect(() => requiredPhone.parse("12 34")).toThrow() // With spaces
      expect(() => requiredPhone.parse("0123456789")).toThrow() // Starting with 0
    })
  })

  describe("password", () => {
    it("should validate strong passwords", () => {
      expect(commonSchemas.password.parse("Abcd1234!")).toBe("Abcd1234!")
      expect(commonSchemas.password.parse("MyP@ssw0rd123")).toBe("MyP@ssw0rd123")
    })

    it("should reject weak passwords", () => {
      expect(() => commonSchemas.password.parse("short")).toThrow("at least 8 characters")
      expect(() => commonSchemas.password.parse("alllowercase1!")).toThrow("uppercase")
      expect(() => commonSchemas.password.parse("ALLUPPERCASE1!")).toThrow("lowercase")
      expect(() => commonSchemas.password.parse("NoNumbers!")).toThrow("number")
      expect(() => commonSchemas.password.parse("NoSpecial1")).toThrow("special character")
      expect(() => commonSchemas.password.parse("Has Space1!")).toThrow("cannot contain spaces")
    })
  })

  describe("username", () => {
    it("should validate usernames", () => {
      expect(commonSchemas.username.parse("john_doe")).toBe("john_doe")
      expect(commonSchemas.username.parse("user123")).toBe("user123")
      expect(commonSchemas.username.parse("validUser")).toBe("validUser")
    })

    it("should reject invalid usernames", () => {
      expect(() => commonSchemas.username.parse("ab")).toThrow("at least 3 characters")
      expect(() => commonSchemas.username.parse("a".repeat(31))).toThrow("less than 30")
      expect(() => commonSchemas.username.parse("user@name")).toThrow("letters, numbers")
      expect(() => commonSchemas.username.parse("user name")).toThrow()
    })
  })

  describe("rating", () => {
    it("should validate ratings", () => {
      expect(commonSchemas.rating.parse(1)).toBe(1)
      expect(commonSchemas.rating.parse(3)).toBe(3)
      expect(commonSchemas.rating.parse(5)).toBe(5)
    })

    it("should reject invalid ratings", () => {
      expect(() => commonSchemas.rating.parse(0)).toThrow("at least 1")
      expect(() => commonSchemas.rating.parse(6)).toThrow("at most 5")
      expect(() => commonSchemas.rating.parse(3.5)).toThrow("whole number")
    })
  })

  describe("amount", () => {
    it("should validate amounts", () => {
      expect(commonSchemas.amount.parse("10")).toBe("10")
      expect(commonSchemas.amount.parse("10.5")).toBe("10.5")
      expect(commonSchemas.amount.parse("10.99")).toBe("10.99")
    })

    it("should reject invalid amounts", () => {
      expect(() => commonSchemas.amount.parse("-10")).toThrow()
      expect(() => commonSchemas.amount.parse("10.999")).toThrow("2 decimal places")
      expect(() => commonSchemas.amount.parse("abc")).toThrow()
    })
  })

  describe("year", () => {
    it("should validate years", () => {
      expect(commonSchemas.year.parse("1900")).toBe("1900")
      expect(commonSchemas.year.parse("2023")).toBe("2023")
      expect(commonSchemas.year.parse("2099")).toBe("2099")
      expect(commonSchemas.year.parse(undefined)).toBeUndefined()
    })

    it("should reject invalid years", () => {
      expect(() => commonSchemas.year.parse("1899")).toThrow()
      expect(() => commonSchemas.year.parse("2100")).toThrow()
      expect(() => commonSchemas.year.parse("abc")).toThrow()
    })
  })

  describe("url", () => {
    it("should validate URLs", () => {
      expect(commonSchemas.url.parse("https://example.com")).toBe("https://example.com")
      expect(commonSchemas.url.parse("http://example.com/path")).toBe("http://example.com/path")
      expect(commonSchemas.url.parse(undefined)).toBeUndefined()
    })

    it("should reject invalid URLs", () => {
      expect(() => commonSchemas.url.parse("invalid")).toThrow()
      expect(() => commonSchemas.url.parse("example.com")).toThrow()
    })
  })
})

// ============================================================================
// PERFUME HOUSE SCHEMAS TESTS
// ============================================================================

describe("perfumeHouseSchemas", () => {
  describe("create", () => {
    it("should validate complete perfume house data", () => {
      const validData = {
        name: "Chanel",
        description: "Luxury French perfume house founded by Coco Chanel",
        image: "https://example.com/chanel.jpg",
        website: "https://www.chanel.com",
        country: "France",
        founded: "1910",
        type: "designer" as const,
        email: "contact@chanel.com",
        phone: "+33123456789",
        address: "135 Avenue Charles de Gaulle, Neuilly-sur-Seine, France",
      }

      const result = perfumeHouseSchemas.create.parse(validData)
      expect(result.name).toBe("Chanel")
      expect(result.email).toBe("contact@chanel.com")
    })

    it("should validate minimal perfume house data", () => {
      const minimalData = {
        name: "Chanel",
      }

      const result = perfumeHouseSchemas.create.parse(minimalData)
      expect(result.name).toBe("Chanel")
    })

    it("should reject invalid perfume house data", () => {
      expect(() => perfumeHouseSchemas.create.parse({
          name: "A", // Too short
        })).toThrow()
    })
  })
})

// ============================================================================
// PERFUME SCHEMAS TESTS
// ============================================================================

describe("perfumeSchemas", () => {
  describe("create", () => {
    it("should validate complete perfume data", () => {
      const validData = {
        name: "Chanel No. 5",
        description: "The iconic fragrance by Chanel with aldehydic floral notes",
        house: "chanel-id",
        image: "https://example.com/chanel5.jpg",
        notesTop: ["Aldehydes", "Ylang-ylang"],
        notesHeart: ["Jasmine", "Rose"],
        notesBase: ["Vanilla", "Sandalwood"],
      }

      const result = perfumeSchemas.create.parse(validData)
      expect(result.name).toBe("Chanel No. 5")
      expect(result.notesTop).toEqual(["Aldehydes", "Ylang-ylang"])
    })

    it("should reject invalid perfume data", () => {
      expect(() => perfumeSchemas.create.parse({
          name: "Chanel No. 5",
          description: "Short", // Too short
          house: "chanel-id",
        })).toThrow("at least 10 characters")
    })
  })

  describe("search", () => {
    it("should validate search parameters", () => {
      const searchData = {
        query: "rose",
        houseName: "Chanel",
        sortBy: "rating" as const,
        sortOrder: "desc" as const,
      }

      const result = perfumeSchemas.search.parse(searchData)
      expect(result.query).toBe("rose")
      expect(result.sortBy).toBe("rating")
    })

    it("should validate empty search", () => {
      const result = perfumeSchemas.search.parse({})
      expect(result).toEqual({})
    })
  })
})

// ============================================================================
// RATING SCHEMAS TESTS
// ============================================================================

describe("ratingSchemas", () => {
  describe("create", () => {
    it("should validate rating with at least one value", () => {
      const validData = {
        perfumeId: "perfume-123",
        overall: 5,
      }

      const result = ratingSchemas.create.parse(validData)
      expect(result.overall).toBe(5)
    })

    it("should validate rating with multiple values", () => {
      const validData = {
        perfumeId: "perfume-123",
        longevity: 4,
        sillage: 5,
        overall: 5,
      }

      const result = ratingSchemas.create.parse(validData)
      expect(result.longevity).toBe(4)
      expect(result.sillage).toBe(5)
    })

    it("should reject rating with no values", () => {
      expect(() => ratingSchemas.create.parse({
          perfumeId: "perfume-123",
        })).toThrow("At least one rating is required")
    })

    it("should reject invalid rating values", () => {
      expect(() => ratingSchemas.create.parse({
          perfumeId: "perfume-123",
          overall: 6,
        })).toThrow()
    })
  })
})

// ============================================================================
// COMMENT SCHEMAS TESTS
// ============================================================================

describe("commentSchemas", () => {
  describe("create", () => {
    it("should validate comment creation", () => {
      const validData = {
        perfumeId: "perfume-123",
        userPerfumeId: "user-perfume-456",
        comment: "This is an amazing perfume!",
        isPublic: true,
      }

      const result = commentSchemas.create.parse(validData)
      expect(result.comment).toBe("This is an amazing perfume!")
      expect(result.isPublic).toBe(true)
    })

    it("should reject empty comments", () => {
      expect(() => commentSchemas.create.parse({
          perfumeId: "perfume-123",
          userPerfumeId: "user-perfume-456",
          comment: "",
        })).toThrow()
    })

    it("should reject comments that are too long", () => {
      expect(() => commentSchemas.create.parse({
          perfumeId: "perfume-123",
          userPerfumeId: "user-perfume-456",
          comment: "x".repeat(1001),
        })).toThrow("less than 1000 characters")
    })
  })
})

// ============================================================================
// WISHLIST SCHEMAS TESTS
// ============================================================================

describe("wishlistSchemas", () => {
  describe("action", () => {
    it("should validate wishlist actions", () => {
      const addAction = {
        perfumeId: "perfume-123",
        action: "add" as const,
        isPublic: "true",
      }

      const result = wishlistSchemas.action.parse(addAction)
      expect(result.action).toBe("add")
      expect(result.isPublic).toBe(true)
    })

    it("should handle isPublic boolean conversion", () => {
      const result1 = wishlistSchemas.action.parse({
        perfumeId: "perfume-123",
        action: "add",
        isPublic: "true",
      })
      expect(result1.isPublic).toBe(true)

      const result2 = wishlistSchemas.action.parse({
        perfumeId: "perfume-123",
        action: "add",
        isPublic: "false",
      })
      expect(result2.isPublic).toBe(false)
    })

    it("should reject invalid actions", () => {
      expect(() => wishlistSchemas.action.parse({
          perfumeId: "perfume-123",
          action: "invalid",
        })).toThrow()
    })
  })
})

// ============================================================================
// AUTH SCHEMAS TESTS
// ============================================================================

describe("authSchemas", () => {
  describe("signup", () => {
    it("should validate user signup", () => {
      const validData = {
        email: "user@example.com",
        password: "SecureP@ss123",
        confirmPassword: "SecureP@ss123",
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        acceptTerms: "true",
      }

      const result = authSchemas.signup.parse(validData)
      expect(result.email).toBe("user@example.com")
      expect(result.acceptTerms).toBe(true)
    })

    it("should reject mismatched passwords", () => {
      expect(() => authSchemas.signup.parse({
          email: "user@example.com",
          password: "SecureP@ss123",
          confirmPassword: "DifferentP@ss123",
          acceptTerms: "true",
        })).toThrow("Passwords do not match")
    })

    it("should reject if terms not accepted", () => {
      expect(() => authSchemas.signup.parse({
          email: "user@example.com",
          password: "SecureP@ss123",
          confirmPassword: "SecureP@ss123",
          acceptTerms: "false",
        })).toThrow("accept the terms")
    })
  })

  describe("login", () => {
    it("should validate user login", () => {
      const validData = {
        email: "user@example.com",
        password: "anypassword",
        rememberMe: true,
      }

      const result = authSchemas.login.parse(validData)
      expect(result.email).toBe("user@example.com")
      expect(result.rememberMe).toBe(true)
    })
  })

  describe("changePassword", () => {
    it("should validate password change", () => {
      const validData = {
        currentPassword: "OldP@ss123",
        newPassword: "NewSecureP@ss456",
        confirmNewPassword: "NewSecureP@ss456",
      }

      const result = authSchemas.changePassword.parse(validData)
      expect(result.currentPassword).toBe("OldP@ss123")
    })

    it("should reject if new passwords do not match", () => {
      expect(() => authSchemas.changePassword.parse({
          currentPassword: "OldP@ss123",
          newPassword: "NewSecureP@ss456",
          confirmNewPassword: "DifferentP@ss456",
        })).toThrow("New passwords do not match")
    })

    it("should reject if new password is same as current", () => {
      expect(() => authSchemas.changePassword.parse({
          currentPassword: "SameP@ss123",
          newPassword: "SameP@ss123",
          confirmNewPassword: "SameP@ss123",
        })).toThrow("different from current password")
    })
  })
})

// ============================================================================
// API SCHEMAS TESTS
// ============================================================================

describe("apiSchemas", () => {
  describe("pagination", () => {
    it("should validate and transform pagination params", () => {
      const result = apiSchemas.pagination.parse({
        page: "2",
        limit: "20",
      })

      expect(result.page).toBe(2)
      expect(result.limit).toBe(20)
    })

    it("should handle missing pagination params", () => {
      const result = apiSchemas.pagination.parse({})
      expect(result.page).toBeUndefined()
      expect(result.limit).toBeUndefined()
    })

    it("should reject invalid pagination values", () => {
      expect(() => apiSchemas.pagination.parse({
          page: "0",
        })).toThrow()

      expect(() => apiSchemas.pagination.parse({
          limit: "101",
        })).toThrow()
    })
  })

  describe("search", () => {
    it("should validate search query params", () => {
      const result = apiSchemas.search.parse({
        q: "rose",
        sortBy: "rating",
        sortOrder: "desc",
      })

      expect(result.q).toBe("rose")
      expect(result.sortBy).toBe("rating")
    })
  })
})

// ============================================================================
// ADMIN SCHEMAS TESTS
// ============================================================================

describe("adminSchemas", () => {
  describe("userForm", () => {
    it("should validate admin user form", () => {
      const validData = {
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        username: "adminuser",
        role: "ADMIN" as const,
        isActive: true,
      }

      const result = adminSchemas.userForm.parse(validData)
      expect(result.role).toBe("ADMIN")
      expect(result.isActive).toBe(true)
    })

    it("should reject invalid roles", () => {
      expect(() => adminSchemas.userForm.parse({
          email: "admin@example.com",
          role: "SUPERUSER",
          isActive: true,
        })).toThrow()
    })
  })

  describe("dataQualityReport", () => {
    it("should validate report configuration", () => {
      const validData = {
        timeframe: "30d" as const,
        includeHistory: true,
        exportFormat: "csv" as const,
      }

      const result = adminSchemas.dataQualityReport.parse(validData)
      expect(result.timeframe).toBe("30d")
      expect(result.exportFormat).toBe("csv")
    })
  })
})

// ============================================================================
// VALIDATION SCHEMAS EXPORT TESTS
// ============================================================================

describe("validationSchemas", () => {
  it("should export all schema categories", () => {
    expect(validationSchemas.common).toBeDefined()
    expect(validationSchemas.perfumeHouse).toBeDefined()
    expect(validationSchemas.perfume).toBeDefined()
    expect(validationSchemas.rating).toBeDefined()
    expect(validationSchemas.comment).toBeDefined()
    expect(validationSchemas.wishlist).toBeDefined()
    expect(validationSchemas.auth).toBeDefined()
    expect(validationSchemas.api).toBeDefined()
    expect(validationSchemas.admin).toBeDefined()
  })

  it("should provide access to nested schemas", () => {
    expect(validationSchemas.common.email).toBeDefined()
    expect(validationSchemas.auth.login).toBeDefined()
    expect(validationSchemas.perfume.create).toBeDefined()
  })
})

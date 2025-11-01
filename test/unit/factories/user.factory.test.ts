/**
 * User Factory Tests
 * Tests for user test data factory functions
 */

import { describe, expect, it } from "vitest"

import {
  createMockAdminUser,
  createMockEditorUser,
  createMockSafeUser,
  createMockUser,
  createMockUsers,
  userFactoryPresets,
} from "../../factories/user.factory"

describe("User Factory", () => {
  describe("createMockUser", () => {
    it("should create a user with default values", () => {
      const user = createMockUser()

      expect(user).toHaveProperty("id")
      expect(user).toHaveProperty("email")
      expect(user).toHaveProperty("password")
      expect(user).toHaveProperty("firstName")
      expect(user).toHaveProperty("lastName")
      expect(user).toHaveProperty("username")
      expect(user).toHaveProperty("role")
      expect(user).toHaveProperty("createdAt")
      expect(user).toHaveProperty("updatedAt")
      expect(user.role).toBe("user")
    })

    it("should create a user with overridden values", () => {
      const overrides = {
        id: "test-id",
        email: "test@example.com",
        role: "admin" as const,
      }
      const user = createMockUser(overrides)

      expect(user.id).toBe("test-id")
      expect(user.email).toBe("test@example.com")
      expect(user.role).toBe("admin")
    })

    it("should generate valid email addresses", () => {
      const user = createMockUser()

      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(user.email).toBe(user.email.toLowerCase())
    })

    it("should handle null firstName and lastName", () => {
      const user = createMockUser({
        firstName: null,
        lastName: null,
      })

      expect(user.firstName).toBeNull()
      expect(user.lastName).toBeNull()
    })

    it("should generate unique IDs by default", () => {
      const user1 = createMockUser()
      const user2 = createMockUser()

      expect(user1.id).not.toBe(user2.id)
    })
  })

  describe("createMockSafeUser", () => {
    it("should create a safe user without password", () => {
      const safeUser = createMockSafeUser()

      expect(safeUser).toHaveProperty("id")
      expect(safeUser).toHaveProperty("email")
      expect(safeUser).not.toHaveProperty("password")
      expect(safeUser).toHaveProperty("firstName")
      expect(safeUser).toHaveProperty("lastName")
      expect(safeUser).toHaveProperty("username")
      expect(safeUser).toHaveProperty("role")
    })

    it("should respect overrides", () => {
      const safeUser = createMockSafeUser({
        email: "safe@example.com",
        role: "editor",
      })

      expect(safeUser.email).toBe("safe@example.com")
      expect(safeUser.role).toBe("editor")
    })
  })

  describe("createMockAdminUser", () => {
    it("should create an admin user", () => {
      const admin = createMockAdminUser()

      expect(admin.role).toBe("admin")
      expect(admin.email).toContain("admin")
    })

    it("should allow email override", () => {
      const admin = createMockAdminUser({
        email: "custom-admin@example.com",
      })

      expect(admin.email).toBe("custom-admin@example.com")
      expect(admin.role).toBe("admin")
    })
  })

  describe("createMockEditorUser", () => {
    it("should create an editor user", () => {
      const editor = createMockEditorUser()

      expect(editor.role).toBe("editor")
      expect(editor.email).toContain("editor")
    })
  })

  describe("createMockUsers", () => {
    it("should create multiple users", () => {
      const users = createMockUsers(5)

      expect(users).toHaveLength(5)
      expect(users[0]!.id).toBe("user-1")
      expect(users[4]!.id).toBe("user-5")
    })

    it("should apply overrides to all users", () => {
      const users = createMockUsers(3, { role: "editor" })

      users.forEach(user => {
        expect(user.role).toBe("editor")
      })
    })

    it("should create users with unique IDs when not overridden", () => {
      const users = createMockUsers(3, {})

      const ids = users.map(u => u.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3)
    })
  })

  describe("userFactoryPresets", () => {
    it("should create a new user with recent dates", () => {
      const newUser = userFactoryPresets.newUser()

      expect(newUser.firstName).toBeNull()
      expect(newUser.lastName).toBeNull()

      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      expect(newUser.createdAt.getTime()).toBeGreaterThan(oneDayAgo.getTime())
    })

    it("should create an established user with complete profile", () => {
      const established = userFactoryPresets.establishedUser()

      expect(established.firstName).toBeTruthy()
      expect(established.lastName).toBeTruthy()
      expect(established.username).toBeTruthy()

      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      expect(established.createdAt.getTime()).toBeLessThan(Date.now())
    })

    it("should create a minimal user with null optional fields", () => {
      const minimal = userFactoryPresets.minimalUser()

      expect(minimal.firstName).toBeNull()
      expect(minimal.lastName).toBeNull()
      expect(minimal.username).toBeNull()
      expect(minimal.email).toBeTruthy()
    })

    it("should create a user with special characters", () => {
      const special = userFactoryPresets.specialCharUser()

      expect(special.firstName).toContain("'")
      expect(special.lastName).toContain("-")
      expect(special.username).toMatch(/[_-]/)
    })

    it("should create a user with long names", () => {
      const longName = userFactoryPresets.longNameUser()

      expect(longName.firstName!.length).toBeGreaterThan(20)
      expect(longName.lastName!.length).toBeGreaterThan(20)
    })
  })

  describe("Data Validation", () => {
    it("should generate valid user roles", () => {
      const validRoles = ["user", "admin", "editor"]

      for (let i = 0; i < 10; i++) {
        const user = createMockUser()
        expect(validRoles).toContain(user.role)
      }
    })

    it("should have updatedAt after or equal to createdAt", () => {
      const user = createMockUser()

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(user.createdAt.getTime())
    })

    it("should handle custom dates correctly", () => {
      const customCreatedAt = new Date("2020-01-01")
      const customUpdatedAt = new Date("2023-01-01")

      const user = createMockUser({
        createdAt: customCreatedAt,
        updatedAt: customUpdatedAt,
      })

      expect(user.createdAt).toBe(customCreatedAt)
      expect(user.updatedAt).toBe(customUpdatedAt)
    })
  })
})

/**
 * User Test Data Factory
 * Generates realistic user data for testing using @faker-js/faker
 */

import { faker } from "@faker-js/faker"
import type { UserRole } from "@prisma/client"

import type { SafeUser, User } from "~/types/database"

/**
 * Options for creating a mock user
 */
export interface CreateMockUserOptions {
  id?: string
  email?: string
  password?: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  role?: UserRole
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Creates a mock User with realistic data
 * @param overrides - Optional field overrides
 * @returns Mock User object
 */
export function createMockUser(overrides: CreateMockUserOptions = {}): Omit<
  User,
  | "UserPerfume"
  | "userPerfumeComments"
  | "UserPerfumeRating"
  | "UserPerfumeReview"
  | "UserPerfumeWishlist"
  | "wishlistNotifications"
  | "userAlerts"
  | "alertPreferences"
> {
  // Handle explicit null values for optional fields
  const firstName =
    overrides.firstName !== undefined
      ? overrides.firstName
      : faker.person.firstName()
  const lastName =
    overrides.lastName !== undefined ? overrides.lastName : faker.person.lastName()
  const username =
    overrides.username !== undefined
      ? overrides.username
      : faker.internet.username({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        })

  return {
    id: overrides.id ?? faker.string.uuid(),
    email:
      overrides.email ??
      faker.internet
        .email({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        })
        .toLowerCase(),
    password: overrides.password ?? faker.internet.password({ length: 20 }),
    firstName,
    lastName,
    username,
    role: overrides.role ?? "user",
    createdAt: overrides.createdAt ?? faker.date.past({ years: 2 }),
    updatedAt: overrides.updatedAt ?? faker.date.recent({ days: 30 }),
  }
}

/**
 * Creates a mock SafeUser (without password)
 * @param overrides - Optional field overrides
 * @returns Mock SafeUser object
 */
export function createMockSafeUser(overrides: Omit<CreateMockUserOptions, "password"> = {}): SafeUser {
  const user = createMockUser(overrides)

  const { password, ...safeUser } = user
  return safeUser as SafeUser
}

/**
 * Creates a mock admin user
 * @param overrides - Optional field overrides
 * @returns Mock admin User object
 */
export function createMockAdminUser(overrides: CreateMockUserOptions = {}): Omit<
  User,
  | "UserPerfume"
  | "userPerfumeComments"
  | "UserPerfumeRating"
  | "UserPerfumeReview"
  | "UserPerfumeWishlist"
  | "wishlistNotifications"
  | "userAlerts"
  | "alertPreferences"
> {
  return createMockUser({
    ...overrides,
    role: "admin",
    email: overrides.email ?? `admin.${faker.internet.email()}`,
  })
}

/**
 * Creates a mock editor user
 * @param overrides - Optional field overrides
 * @returns Mock editor User object
 */
export function createMockEditorUser(overrides: CreateMockUserOptions = {}): Omit<
  User,
  | "UserPerfume"
  | "userPerfumeComments"
  | "UserPerfumeRating"
  | "UserPerfumeReview"
  | "UserPerfumeWishlist"
  | "wishlistNotifications"
  | "userAlerts"
  | "alertPreferences"
> {
  return createMockUser({
    ...overrides,
    role: "editor",
    email: overrides.email ?? `editor.${faker.internet.email()}`,
  })
}

/**
 * Creates multiple mock users
 * @param count - Number of users to create
 * @param overrides - Optional field overrides for all users
 * @returns Array of mock User objects
 */
export function createMockUsers(
  count: number,
  overrides: CreateMockUserOptions = {}
): Array<
  Omit<
    User,
    | "UserPerfume"
    | "userPerfumeComments"
    | "UserPerfumeRating"
    | "UserPerfumeReview"
    | "UserPerfumeWishlist"
    | "wishlistNotifications"
    | "userAlerts"
    | "alertPreferences"
  >
> {
  return Array.from({ length: count }, (_, i) => createMockUser({
      ...overrides,
      id: overrides.id ?? `user-${i + 1}`,
    }))
}

/**
 * Creates a mock user with specific test scenarios
 */
export const userFactoryPresets = {

  /**
   * New user who just signed up
   */
  newUser: (): ReturnType<typeof createMockUser> => createMockUser({
      createdAt: faker.date.recent({ days: 1 }),
      updatedAt: faker.date.recent({ days: 1 }),
      firstName: null,
      lastName: null,
    }),

  /**
   * Established user with complete profile
   */
  establishedUser: (): ReturnType<typeof createMockUser> => createMockUser({
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 7 }),
    }),

  /**
   * User with minimal information
   */
  minimalUser: (): ReturnType<typeof createMockUser> => createMockUser({
      firstName: null,
      lastName: null,
      username: null,
    }),

  /**
   * User with special characters in name (edge case)
   */
  specialCharUser: (): ReturnType<typeof createMockUser> => createMockUser({
      firstName: "O'Brien",
      lastName: "Smith-Jones",
      username: "user_test-123",
    }),

  /**
   * User with very long name (edge case)
   */
  longNameUser: (): ReturnType<typeof createMockUser> => createMockUser({
      firstName: faker.lorem.words(10),
      lastName: faker.lorem.words(10),
    }),
}

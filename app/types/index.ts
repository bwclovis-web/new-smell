import type { User as PrismaUser, UserRole } from '@prisma-app/client'

/**
 * Global type definitions for the application
 */

/**
 * User interface matching the Prisma User model
 */
export interface User {
  id: string
  email: string
  password: string
  name?: string | null
  createdAt: Date
  updatedAt: Date
  role: UserRole
}

/**
 * Safe user information (excluding sensitive data like password)
 * Use this for passing user data to the client
 */
export interface SafeUser {
  id: string
  email: string
  name?: string | null
  role: UserRole
}

/**
 * Create a safe user object by omitting sensitive fields
 */
export function createSafeUser(user: User | null): SafeUser | null {
  if (!user) {
    return null
  }

  const { password, ...safeUser } = user
  return safeUser as SafeUser
}

export type { UserRole }

interface PerfumeHouseI {
  id: string
  name: string
}

interface PerfumeI {
  id: string
  name: string
  description?: string
  perfumeHouse?: PerfumeHouseI
}

export interface UserPerfumeI {
  id: string
  userId: string
  perfumeId: string
  perfume: PerfumeI
  amount: string
}

import type { UserRole } from '@prisma/client'

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
  firstName?: string | null
  lastName?: string | null
  username?: string | null
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
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  role: UserRole
}

/**
 * Create a safe user object by omitting sensitive fields
 */
export function createSafeUser(user: User | null): SafeUser | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role
  }
}

export type { UserRole }

// Rating System Types - Film Noir Themed
export interface RatingLabels {
  longevity: Record<number, string>
  sillage: Record<number, string>
  gender: Record<number, string>
  priceValue: Record<number, string>
  overall: Record<number, string>
}

export const RATING_LABELS: RatingLabels = {
  longevity: {
    1: 'Fleeting Shadow',
    2: 'Brief Encounter',
    3: 'Steady Presence',
    4: 'Lingering Mystery',
    5: 'Eternal Obsession'
  },
  sillage: {
    1: 'Whispered Secret',
    2: 'Subtle Intrigue',
    3: 'Bold Statement',
    4: 'Commanding Aura',
    5: 'Room Domination'
  },
  gender: {
    1: 'Distinctly Feminine',
    2: 'Elegantly Feminine',
    3: 'Mysterious Unisex',
    4: 'Dashingly Masculine',
    5: 'Distinctly Masculine'
  },
  priceValue: {
    1: 'Highway Robbery',
    2: 'Steep Price',
    3: 'Fair Deal',
    4: 'Smart Investment',
    5: 'Stolen Treasure'
  },
  overall: {
    1: 'Despise',
    2: 'Dismiss',
    3: 'Tolerable',
    4: 'Admire',
    5: 'Obsessed'
  }
}

export interface UserPerfumeRating {
  id: string
  userId: string
  perfumeId: string
  longevity?: number | null
  sillage?: number | null
  gender?: number | null
  priceValue?: number | null
  overall?: number | null
  createdAt: Date
  updatedAt: Date
}

export interface PerfumeRatingStats {
  perfumeId: string
  totalVotes: number
  averages: {
    longevity: number | null
    sillage: number | null
    gender: number | null
    priceValue: number | null
    overall: number | null
  }
  distribution: {
    longevity: Record<number, number>
    sillage: Record<number, number>
    gender: Record<number, number>
    priceValue: Record<number, number>
    overall: Record<number, number>
  }
}

interface PerfumeHouseI {
  id: string
  name: string
}

export interface PerfumeI {
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
  available: string
  price?: string
  type?: string
  placeOfPurchase?: string
  tradePrice?: string
  tradePreference?: 'cash' | 'trade' | 'both'
  tradeOnly?: boolean
  comments?: {
    id: string
    userId: string
    perfumeId: string
    userPerfumeId: string
    comment: string
    isPublic: boolean
    createdAt: Date | string
    updatedAt: Date | string
  }[]
}

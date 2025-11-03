/**
 * Core type definitions for data models
 * Used across queries, mutations, and components
 */

// Base interfaces
export interface BaseModel {
  id: string
  createdAt: string | Date
  updatedAt: string | Date
}

// House/Perfume House
export interface House extends BaseModel {
  name: string
  slug: string
  type: "niche" | "designer" | "indie" | "celebrity" | "drugstore"
  description?: string | null
  country?: string | null
  yearFounded?: number | null
  website?: string | null
  image?: string | null
  _count?: {
    perfumes: number
  }
}

// Perfume
export interface Perfume extends BaseModel {
  name: string
  slug: string
  description?: string | null
  concentration?: string | null
  gender?: string | null
  releaseYear?: number | null
  image?: string | null
  houseId: string
  house?: House
  _count?: {
    reviews: number
    ratings: number
    wishlistItems: number
  }
  averageRatings?: {
    longevity: number | null
    sillage: number | null
    gender: number | null
    priceValue: number | null
    overall: number | null
    totalRatings: number
  }
}

// User
export interface User extends BaseModel {
  email: string
  username?: string | null
  role: "user" | "admin" | "moderator"
  avatar?: string | null
}

// Review
export interface Review extends BaseModel {
  review: string
  isApproved: boolean
  userId: string
  perfumeId: string
  user?: User
  perfume?: Perfume
  isPending?: boolean // For optimistic updates
}

// Rating
export interface Rating extends BaseModel {
  category: "longevity" | "sillage" | "gender" | "priceValue" | "overall"
  rating: number // 1-5
  userId: string
  perfumeId: string
  user?: User
  perfume?: Perfume
}

// Wishlist Item
export interface WishlistItem extends BaseModel {
  userId: string
  perfumeId: string
  isPublic: boolean
  user?: User
  perfume?: Perfume
}

// Alert
export interface Alert extends BaseModel {
  type: "wishlist_available" | "decant_interest" | "price_drop" | "new_review"
  message: string
  isRead: boolean
  userId: string
  perfumeId?: string
  user?: User
  perfume?: Perfume
}

// Tag
export interface Tag extends BaseModel {
  name: string
  slug: string
  description?: string | null
  _count?: {
    perfumes: number
  }
}


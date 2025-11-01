/**
 * API response types and request/response interfaces
 * Provides type safety for all API endpoints
 */

import type {
  SafeUser,
  SafeUserPerfume,
  SafeUserPerfumeComment,
  SafeUserPerfumeRating,
  SafeUserPerfumeReview,
} from "./database"

// Base API response structure
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
  code?: string
  timestamp: string
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  timestamp: string
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
  take?: number
  skip?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Search and filter types
export interface SearchParams {
  query?: string
  houseName?: string
  perfumeName?: string
  notes?: string[]
  type?: string
  priceRange?: {
    min: number
    max: number
  }
  ratingRange?: {
    min: number
    max: number
  }
}

export interface SortParams {
  field: string
  direction: "asc" | "desc"
}

// Authentication API types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: SafeUser
  token: string
  expiresAt: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  username?: string
}

export interface RegisterResponse {
  user: SafeUser
  token: string
  expiresAt: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

// User API types
export interface GetUserResponse {
  user: SafeUser
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  username?: string
  email?: string
}

export interface UpdateUserResponse {
  user: SafeUser
}

// Perfume API types
export interface GetPerfumesRequest extends PaginationParams, SearchParams {
  houseId?: string
  includeRatings?: boolean
  includeReviews?: boolean
}

export interface GetPerfumesResponse {
  perfumes: SafeUserPerfume[]
  pagination: PaginatedResponse<SafeUserPerfume>["pagination"]
}

export interface GetPerfumeRequest {
  id: string
  includeRatings?: boolean
  includeReviews?: boolean
  includeComments?: boolean
}

export interface GetPerfumeResponse {
  perfume: SafeUserPerfume
  ratings?: SafeUserPerfumeRating[]
  reviews?: SafeUserPerfumeReview[]
  comments?: SafeUserPerfumeComment[]
}

export interface CreatePerfumeRequest {
  name: string
  description?: string
  image?: string
  perfumeHouseId?: string
  amount: string
  available: string
  price?: string
  placeOfPurchase?: string
  tradePrice?: string
  tradePreference?: "cash" | "trade" | "both"
  tradeOnly?: boolean
  type?: string
}

export interface CreatePerfumeResponse {
  perfume: SafeUserPerfume
}

export interface UpdatePerfumeRequest {
  id: string
  amount?: string
  available?: string
  price?: string
  placeOfPurchase?: string
  tradePrice?: string
  tradePreference?: "cash" | "trade" | "both"
  tradeOnly?: boolean
  type?: string
}

export interface UpdatePerfumeResponse {
  perfume: SafeUserPerfume
}

export interface DeletePerfumeRequest {
  id: string
}

export interface DeletePerfumeResponse {
  success: boolean
  message: string
}

// Rating API types
export interface CreateRatingRequest {
  perfumeId: string
  longevity?: number
  sillage?: number
  gender?: number
  priceValue?: number
  overall?: number
}

export interface CreateRatingResponse {
  rating: SafeUserPerfumeRating
}

export interface UpdateRatingRequest {
  id: string
  longevity?: number
  sillage?: number
  gender?: number
  priceValue?: number
  overall?: number
}

export interface UpdateRatingResponse {
  rating: SafeUserPerfumeRating
}

export interface DeleteRatingRequest {
  id: string
}

export interface DeleteRatingResponse {
  success: boolean
  message: string
}

// Comment API types
export interface CreateCommentRequest {
  perfumeId: string
  userPerfumeId: string
  comment: string
  isPublic?: boolean
}

export interface CreateCommentResponse {
  comment: SafeUserPerfumeComment
}

export interface UpdateCommentRequest {
  id: string
  comment: string
  isPublic?: boolean
}

export interface UpdateCommentResponse {
  comment: SafeUserPerfumeComment
}

export interface DeleteCommentRequest {
  id: string
}

export interface DeleteCommentResponse {
  success: boolean
  message: string
}

// Wishlist API types
export interface AddToWishlistRequest {
  perfumeId: string
}

export interface AddToWishlistResponse {
  success: boolean
  message: string
}

export interface RemoveFromWishlistRequest {
  perfumeId: string
}

export interface RemoveFromWishlistResponse {
  success: boolean
  message: string
}

export interface GetWishlistResponse {
  wishlist: SafeUserPerfume[]
  pagination: PaginatedResponse<SafeUserPerfume>["pagination"]
}

// Data Quality API types
export interface DataQualityStats {
  totalMissing: number
  totalDuplicates: number
  totalHousesNoPerfumes?: number
  missingByBrand: Record<string, number>
  duplicatesByBrand: Record<string, number>
  lastUpdated: string
  historyData?: {
    dates: string[]
    missing: number[]
    duplicates: number[]
  }
  totalMissingHouseInfo?: number
  missingHouseInfoByBrand?: Record<string, number>
  housesNoPerfumes?: Array<{
    id: string
    name: string
    type: string
    createdAt: string
  }>
}

export interface GetDataQualityResponse {
  stats: DataQualityStats
}

export interface UploadCSVRequest {
  file: File
  houseName: string
}

export interface UploadCSVResponse {
  success: boolean
  message: string
  processed: number
  errors: string[]
}

// Security API types
export interface SecurityEvent {
  id: string
  type: string
  userId: string | null
  ipAddress: string | null
  userAgent: string | null
  path: string | null
  method: string | null
  details: Record<string, unknown>
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
}

export interface SecurityStats {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  recentEvents: SecurityEvent[]
  lastUpdated: string
}

export interface GetSecurityStatsResponse {
  stats: SecurityStats
}

// Form validation types
export interface FormValidationError {
  field: string
  message: string
  code?: string
}

export interface FormValidationResponse {
  success: boolean
  errors?: FormValidationError[]
  data?: unknown
}

// Generic API error types
export interface ApiError {
  code: string
  message: string
  field?: string
  details?: Record<string, unknown>
}

export interface ValidationError extends ApiError {
  code: "VALIDATION_ERROR"
  field: string
  details: {
    value: unknown
    constraint: string
  }
}

export interface AuthenticationError extends ApiError {
  code: "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR"
}

export interface NotFoundError extends ApiError {
  code: "NOT_FOUND"
}

export interface ConflictError extends ApiError {
  code: "CONFLICT"
}

export interface ServerError extends ApiError {
  code: "INTERNAL_SERVER_ERROR"
}

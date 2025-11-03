/**
 * Cache Management Utilities for TanStack Query
 * 
 * Provides utilities for invalidating and clearing query cache
 * based on resource types and hierarchical query keys.
 */

import { queryClient } from "../queryClient"
import { queryKeys as houseQueryKeys } from "../queries/houses"
import { queryKeys as perfumeQueryKeys } from "../queries/perfumes"
import { queryKeys as reviewQueryKeys } from "../queries/reviews"
import { queryKeys as userQueryKeys } from "../queries/user"
import { queryKeys as dataQualityQueryKeys } from "../queries/dataQuality"
import { queryKeys as tagQueryKeys } from "../queries/tags"

/**
 * Resource types that can be selectively cleared from cache
 */
export type CacheResourceType =
  | "houses"
  | "perfumes"
  | "reviews"
  | "ratings"
  | "user"
  | "dataQuality"
  | "tags"
  | "all"

/**
 * Clear all queries from the cache
 */
export function clearAllCache() {
  queryClient.clear()
}

/**
 * Invalidate all queries, marking them as stale so they refetch on next use
 */
export function invalidateAllCache() {
  queryClient.invalidateQueries()
}

/**
 * Clear cache for a specific resource type
 * 
 * @param resourceType - The type of resource to clear from cache
 */
export function clearCacheByResource(resourceType: CacheResourceType) {
  switch (resourceType) {
    case "houses":
      queryClient.removeQueries({ queryKey: houseQueryKeys.houses.all })
      break
    case "perfumes":
      queryClient.removeQueries({ queryKey: perfumeQueryKeys.perfumes.all })
      break
    case "reviews":
      queryClient.removeQueries({ queryKey: reviewQueryKeys.reviews.all })
      break
    case "ratings":
      queryClient.removeQueries({ queryKey: reviewQueryKeys.ratings.all })
      break
    case "user":
      queryClient.removeQueries({ queryKey: userQueryKeys.user.all })
      break
    case "dataQuality":
      queryClient.removeQueries({
        queryKey: dataQualityQueryKeys.dataQuality.all,
      })
      break
    case "tags":
      queryClient.removeQueries({ queryKey: tagQueryKeys.tags.all })
      break
    case "all":
      clearAllCache()
      break
  }
}

/**
 * Invalidate cache for a specific resource type
 * Marks queries as stale so they refetch on next use
 * 
 * @param resourceType - The type of resource to invalidate
 */
export function invalidateCacheByResource(resourceType: CacheResourceType) {
  switch (resourceType) {
    case "houses":
      queryClient.invalidateQueries({ queryKey: houseQueryKeys.houses.all })
      break
    case "perfumes":
      queryClient.invalidateQueries({ queryKey: perfumeQueryKeys.perfumes.all })
      break
    case "reviews":
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.reviews.all })
      break
    case "ratings":
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.ratings.all })
      break
    case "user":
      queryClient.invalidateQueries({ queryKey: userQueryKeys.user.all })
      break
    case "dataQuality":
      queryClient.invalidateQueries({
        queryKey: dataQualityQueryKeys.dataQuality.all,
      })
      break
    case "tags":
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags.all })
      break
    case "all":
      invalidateAllCache()
      break
  }
}

/**
 * Clear all user-specific data from cache
 * Used when user logs out or switches accounts
 * 
 * Clears:
 * - User perfumes
 * - Wishlist
 * - User alerts
 * - User reviews
 * - User ratings
 */
export function clearUserCache() {
  // Clear all user-related queries
  queryClient.removeQueries({ queryKey: userQueryKeys.user.all })
  
  // Also clear user-specific reviews and ratings
  queryClient.removeQueries({
    predicate: (query) => {
      const key = query.queryKey
      // Check if query key contains "user" or "userReviews" or "userRating"
      return (
        (Array.isArray(key) && key.includes("user")) ||
        (Array.isArray(key) && key.includes("userReviews")) ||
        (Array.isArray(key) && key.includes("userRating"))
      )
    },
  })
}

/**
 * Clear cache on logout
 * Removes all user-specific data and invalidates public data that might be user-specific
 */
export function clearCacheOnLogout() {
  // Clear all user-specific queries
  clearUserCache()
  
  // Invalidate (but don't remove) public data that might have user-specific info
  // This ensures fresh data on next login
  invalidateCacheByResource("perfumes")
  invalidateCacheByResource("houses")
}

/**
 * Clear cache for specific perfume-related queries
 * Useful when a perfume is updated or deleted
 * 
 * @param perfumeId - Optional perfume ID to clear specific queries
 */
export function clearPerfumeCache(perfumeId?: string) {
  if (perfumeId) {
    // Clear specific perfume queries
    queryClient.removeQueries({
      queryKey: perfumeQueryKeys.perfumes.detail(perfumeId),
    })
    queryClient.removeQueries({
      queryKey: reviewQueryKeys.reviews.byPerfume(perfumeId),
    })
    queryClient.removeQueries({
      queryKey: reviewQueryKeys.ratings.byPerfume(perfumeId),
    })
  } else {
    // Clear all perfume-related queries
    clearCacheByResource("perfumes")
    clearCacheByResource("reviews")
    clearCacheByResource("ratings")
  }
}

/**
 * Clear cache for specific house-related queries
 * Useful when a house is updated or deleted
 * 
 * @param houseSlug - Optional house slug to clear specific queries
 */
export function clearHouseCache(houseSlug?: string) {
  if (houseSlug) {
    // Note: We'd need a detail query key for houses to clear specific ones
    // For now, invalidate all house queries when a specific house changes
    invalidateCacheByResource("houses")
  } else {
    clearCacheByResource("houses")
  }
}


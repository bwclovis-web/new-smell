import { useQuery } from "@tanstack/react-query"

import {
  getReviews,
  queryKeys,
  type ReviewFilters,
  type ReviewPagination,
} from "~/lib/queries/reviews"

/**
 * Hook to fetch reviews for a specific perfume.
 * 
 * @param perfumeId - Perfume ID
 * @param pagination - Pagination options (page, limit)
 * @returns Query result with reviews data and pagination info
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePerfumeReviews(perfumeId, { page: 1, limit: 5 })
 * const reviews = data?.reviews || []
 * ```
 */
export function usePerfumeReviews(
  perfumeId: string,
  pagination: ReviewPagination = { page: 1, limit: 10 }
) {
  const filters: ReviewFilters = {
    perfumeId,
    isApproved: true, // Only show approved reviews by default
  }

  return useQuery({
    queryKey: queryKeys.reviews.byPerfume(perfumeId, pagination),
    queryFn: () => getReviews(filters, pagination),
    enabled: !!perfumeId,
    staleTime: 2 * 60 * 1000, // 2 minutes (reviews might change more frequently)
  })
}


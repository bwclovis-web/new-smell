import { useQuery } from "@tanstack/react-query"

import { getRatings, queryKeys } from "~/lib/queries/reviews"

/**
 * Hook to fetch ratings for a specific perfume.
 * 
 * @param perfumeId - Perfume ID
 * @returns Query result with ratings data including averages
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePerfumeRatings(perfumeId)
 * const averageRatings = data?.averageRatings
 * ```
 */
export function usePerfumeRatings(perfumeId: string) {
  return useQuery({
    queryKey: queryKeys.ratings.byPerfume(perfumeId),
    queryFn: () => getRatings(perfumeId),
    enabled: !!perfumeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}


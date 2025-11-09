import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  type DataQualityTimeframe,
  getDataQualityStats,
  queryKeys,
} from "~/lib/queries/dataQuality"

import { type DataQualityStats } from "../utils/chartDataUtils"

/**
 * Hook to fetch data quality statistics using TanStack Query.
 * Replaces manual fetch logic with useQuery for better caching and state management.
 * 
 * @param timeframe - Timeframe for the statistics: "week", "month", or "all"
 * @returns Query result with stats, loading, error, and forceRefresh function
 */
export const useFetchDataQualityStats = (timeframe: DataQualityTimeframe) => {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.dataQuality.stats(timeframe, false),
    queryFn: () => getDataQualityStats(timeframe, false),
    staleTime: 30 * 1000, // 30 seconds (shorter than default, but still cached)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Force refresh function that can trigger regeneration
  const forceRefresh = async (force: boolean = false) => {
    if (force) {
      // For force refresh, fetch with force=true and update cache
      const freshData = await queryClient.fetchQuery({
        queryKey: queryKeys.dataQuality.stats(timeframe, force),
        queryFn: () => getDataQualityStats(timeframe, force),
      })
      // Update the cache for the non-force query key too
      queryClient.setQueryData(
        queryKeys.dataQuality.stats(timeframe, false),
        freshData
      )
    } else {
      // Regular refetch
      await query.refetch()
    }
  }

  return {
    stats: query.data || null,
    loading: query.isLoading,
    error: query.error
      ? `Failed to fetch data quality stats: ${
          query.error instanceof Error
            ? query.error.message
            : String(query.error)
        }`
      : null,
    forceRefresh,
  }
}

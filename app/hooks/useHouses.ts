import { useQuery } from "@tanstack/react-query"

import { getHouseSort, type HouseFilters, queryKeys } from "~/lib/queries/houses"

/**
 * Hook to fetch houses with filtering and sorting.
 * Replaces useHousesWithLocalCache with TanStack Query.
 * 
 * @param filters - Filter and sorting options
 * @returns Query result with data, isLoading, error, etc.
 * 
 * @example
 * ```tsx
 * const { data: houses, isLoading, error } = useHouses({
 *   houseType: 'niche',
 *   sortBy: 'name-asc'
 * })
 * ```
 */
export function useHouses(filters: HouseFilters = {}) {
  return useQuery({
    queryKey: queryKeys.houses.list(filters),
    queryFn: () => getHouseSort(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes (aligns with previous cache duration)
  })
}


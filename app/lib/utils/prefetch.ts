import { queryClient } from "~/lib/queryClient"
import { getHousesByLetterPaginated, queryKeys as houseQueryKeys } from "~/lib/queries/houses"
import { getPerfumesByLetter, queryKeys as perfumeQueryKeys } from "~/lib/queries/perfumes"

/**
 * Prefetch houses by letter on hover for better UX.
 * 
 * @param letter - Letter to prefetch (A-Z)
 * @param houseType - Type of houses to prefetch (default: "all")
 * @param pageSize - Number of items per page (default: 16)
 */
export async function prefetchHousesByLetter(
  letter: string,
  houseType: string = "all",
  pageSize: number = 16
) {
  if (!letter || !/^[A-Za-z]$/.test(letter)) {
    return
  }

  await queryClient.prefetchQuery({
    queryKey: houseQueryKeys.houses.byLetterPaginated(letter, houseType, 0, pageSize),
    queryFn: () => getHousesByLetterPaginated(letter, houseType, 0, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Prefetch perfumes by letter on hover for better UX.
 * 
 * @param letter - Letter to prefetch (A-Z)
 * @param houseType - Type of houses to filter by (default: "all")
 * @param pageSize - Number of items per page (default: 16)
 */
export async function prefetchPerfumesByLetter(
  letter: string,
  houseType: string = "all",
  pageSize: number = 16
) {
  if (!letter || !/^[A-Za-z]$/.test(letter)) {
    return
  }

  await queryClient.prefetchQuery({
    queryKey: perfumeQueryKeys.perfumes.byLetterPaginated(letter, houseType, 0, pageSize),
    queryFn: () => getPerfumesByLetter(letter, houseType, 0, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Prefetch next page for infinite queries.
 * Useful for prefetching when user is near the end of the current page.
 * 
 * @param queryKey - The query key for the infinite query
 * @param fetchNextPage - Function to fetch the next page
 * @param nextPageParam - The parameter for the next page
 */
export async function prefetchNextPage(
  queryKey: readonly unknown[],
  fetchNextPage: (options?: { pageParam?: unknown }) => Promise<any>,
  nextPageParam: unknown
) {
  // Only prefetch if we have a valid next page parameter
  if (nextPageParam === undefined || nextPageParam === null) {
    return
  }

  try {
    await queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => fetchNextPage({ pageParam }),
      initialPageParam: nextPageParam,
      getNextPageParam: () => undefined, // We're only prefetching one page
      staleTime: 5 * 60 * 1000,
    })
  } catch (error) {
    // Silently fail prefetch - it's just an optimization
    console.debug("Prefetch failed:", error)
  }
}


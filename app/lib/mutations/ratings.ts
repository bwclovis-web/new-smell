import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "~/lib/queries/reviews"
import { queryKeys as perfumeQueryKeys } from "~/lib/queries/perfumes"

export type RatingCategory =
  | "longevity"
  | "sillage"
  | "gender"
  | "priceValue"
  | "overall"

export interface CreateOrUpdateRatingParams {
  perfumeId: string
  category: RatingCategory
  rating: number // 1-5
}

export interface RatingResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
}

/**
 * Create or update a rating mutation function.
 * The API endpoint handles both create and update.
 */
async function saveRating(
  params: CreateOrUpdateRatingParams
): Promise<RatingResponse> {
  const { perfumeId, category, rating } = params

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5")
  }

  const formData = new FormData()
  formData.append("perfumeId", perfumeId)
  formData.append("category", category)
  formData.append("rating", rating.toString())

  const response = await fetch("/api/ratings", {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error || errorData.message || "Failed to save rating"
    )
  }

  return await response.json()
}

/**
 * Hook to create or update a rating with optimistic average updates.
 * This single hook handles both create and update since the API endpoint does both.
 * 
 * @example
 * ```tsx
 * const saveRating = useCreateOrUpdateRating()
 * saveRating.mutate({ perfumeId: "123", category: "overall", rating: 5 })
 * ```
 */
export function useCreateOrUpdateRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveRating,
    onMutate: async (variables) => {
      const { perfumeId, category, rating } = variables

      // Cancel outgoing refetches
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.ratings.byPerfume(perfumeId),
        }),
        queryClient.cancelQueries({
          queryKey: perfumeQueryKeys.perfumes.detail(perfumeId),
        }),
      ])

      // Snapshot previous values for rollback
      const previousRatings = queryClient.getQueryData(
        queryKeys.ratings.byPerfume(perfumeId)
      )
      const previousPerfume = queryClient.getQueryData(
        perfumeQueryKeys.perfumes.detail(perfumeId)
      )

      // Optimistically update ratings
      queryClient.setQueryData(
        queryKeys.ratings.byPerfume(perfumeId),
        (old: any) => {
          if (!old) return old

          const currentAverage = old.averageRatings?.[category] || 0
          const currentTotal = old.averageRatings?.totalRatings || 0

          // Calculate new average optimistically
          // This is a simplified calculation - assumes this is a new rating
          // In reality, if it's an update, we'd need to know the old rating
          const newAverage =
            currentTotal > 0
              ? (currentAverage * currentTotal + rating) / (currentTotal + 1)
              : rating

          return {
            ...old,
            averageRatings: {
              ...old.averageRatings,
              [category]: newAverage,
              totalRatings: currentTotal + 1, // Simplified - assumes new rating
            },
          }
        }
      )

      // Optimistically update perfume detail (if it has averageRatings)
      queryClient.setQueryData(
        perfumeQueryKeys.perfumes.detail(perfumeId),
        (old: any) => {
          if (!old || !old.averageRatings) return old

          const currentAverage = old.averageRatings[category] || 0
          const currentTotal = old.averageRatings.totalRatings || 0

          const newAverage =
            currentTotal > 0
              ? (currentAverage * currentTotal + rating) / (currentTotal + 1)
              : rating

          return {
            ...old,
            averageRatings: {
              ...old.averageRatings,
              [category]: newAverage,
              totalRatings: currentTotal + 1,
            },
          }
        }
      )

      return { previousRatings, previousPerfume }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousRatings) {
        queryClient.setQueryData(
          queryKeys.ratings.byPerfume(variables.perfumeId),
          context.previousRatings
        )
      }
      if (context?.previousPerfume) {
        queryClient.setQueryData(
          perfumeQueryKeys.perfumes.detail(variables.perfumeId),
          context.previousPerfume
        )
      }
    },
    onSuccess: (data, variables) => {
      const { perfumeId } = variables

      // Invalidate ratings queries for this perfume to get accurate averages
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.byPerfume(perfumeId),
      })

      // Invalidate all ratings queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.all,
      })

      // Invalidate perfume detail query (shows average ratings)
      queryClient.invalidateQueries({
        queryKey: perfumeQueryKeys.perfumes.detail(perfumeId),
      })

      // Invalidate perfume lists (might show rating info)
      queryClient.invalidateQueries({
        queryKey: perfumeQueryKeys.perfumes.all,
      })
    },
  })
}

// Alias for convenience (matching the checklist naming)
export const useCreateRating = useCreateOrUpdateRating
export const useUpdateRating = useCreateOrUpdateRating


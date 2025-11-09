import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys as perfumeQueryKeys } from "~/lib/queries/perfumes"
import { queryKeys } from "~/lib/queries/reviews"

export interface CreateReviewParams {
  perfumeId: string
  review: string
}

export interface UpdateReviewParams {
  reviewId: string
  perfumeId: string // Required for query invalidation
  review: string
}

export interface DeleteReviewParams {
  reviewId: string
  perfumeId?: string // Optional, but helps with query invalidation
}

export interface ReviewResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
}

/**
 * Create a new review mutation function.
 */
async function createReview(params: CreateReviewParams): Promise<ReviewResponse> {
  const formData = new FormData()
  formData.append("_action", "create")
  formData.append("perfumeId", params.perfumeId)
  formData.append("review", params.review)

  const response = await fetch("/api/reviews", {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || "Failed to create review")
  }

  return await response.json()
}

/**
 * Update an existing review mutation function.
 */
async function updateReview(params: UpdateReviewParams): Promise<ReviewResponse> {
  const formData = new FormData()
  formData.append("_action", "update")
  formData.append("reviewId", params.reviewId)
  formData.append("review", params.review)

  const response = await fetch("/api/reviews", {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || "Failed to update review")
  }

  return await response.json()
}

/**
 * Delete a review mutation function.
 */
async function deleteReview(params: DeleteReviewParams): Promise<ReviewResponse> {
  const formData = new FormData()
  formData.append("_action", "delete")
  formData.append("reviewId", params.reviewId)

  const response = await fetch("/api/reviews", {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || "Failed to delete review")
  }

  return await response.json()
}

/**
 * Hook to create a new review with optimistic updates.
 * 
 * @example
 * ```tsx
 * const createReview = useCreateReview()
 * createReview.mutate({ perfumeId: "123", review: "Great perfume!" })
 * ```
 */
export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReview,
    onMutate: async variables => {
      const { perfumeId } = variables

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.reviews.byPerfume(perfumeId),
      })

      // Snapshot previous values for rollback
      const previousReviews = queryClient.getQueryData(queryKeys.reviews.byPerfume(perfumeId))

      // Optimistically add a pending review to the list
      queryClient.setQueryData(
        queryKeys.reviews.byPerfume(perfumeId),
        (old: any) => {
          if (!old) {
 return old 
}

          const tempReview = {
            id: `pending-${Date.now()}`,
            review: variables.review,
            createdAt: new Date().toISOString(),
            isApproved: false,
            isPending: true, // Flag to show pending state
            user: {
              id: "current-user", // Will be replaced with actual user data on success
              email: "",
            },
          }

          return {
            ...old,
            reviews: [tempReview, ...(old.reviews || [])],
            pagination: {
              ...old.pagination,
              totalCount: (old.pagination?.totalCount || 0) + 1,
            },
          }
        }
      )

      return { previousReviews }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousReviews) {
        queryClient.setQueryData(
          queryKeys.reviews.byPerfume(variables.perfumeId),
          context.previousReviews
        )
      }
    },
    onSuccess: (data, variables) => {
      const { perfumeId } = variables

      // Invalidate only review queries for this specific perfume
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byPerfume(perfumeId),
        exact: false, // Include pagination variants
      })

      // Invalidate only the perfume detail query (shows review count)
      queryClient.invalidateQueries({
        queryKey: perfumeQueryKeys.perfumes.detail(perfumeId),
        exact: true,
      })

      // Don't invalidate all reviews - too broad
      // Other perfumes' reviews don't need to be refetched
    },
  })
}

/**
 * Hook to update an existing review.
 * 
 * @example
 * ```tsx
 * const updateReview = useUpdateReview()
 * updateReview.mutate({ reviewId: "456", review: "Updated review text" })
 * ```
 */
export function useUpdateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateReview,
    onSuccess: (data, variables) => {
      const { perfumeId } = variables

      // Invalidate only review queries for this specific perfume
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byPerfume(perfumeId),
        exact: false, // Include pagination variants
      })

      // Invalidate only the perfume detail query (shows review count)
      queryClient.invalidateQueries({
        queryKey: perfumeQueryKeys.perfumes.detail(perfumeId),
        exact: true,
      })

      // Don't invalidate all reviews - too broad
    },
  })
}

/**
 * Hook to delete a review with optimistic updates.
 * 
 * @example
 * ```tsx
 * const deleteReview = useDeleteReview()
 * deleteReview.mutate({ reviewId: "456", perfumeId: "123" })
 * ```
 */
export function useDeleteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReview,
    onMutate: async variables => {
      const { reviewId, perfumeId } = variables

      if (!perfumeId) {
 return 
}

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.reviews.byPerfume(perfumeId),
      })

      // Snapshot previous values for rollback
      const previousReviews = queryClient.getQueryData(queryKeys.reviews.byPerfume(perfumeId))

      // Optimistically remove review from list
      queryClient.setQueryData(
        queryKeys.reviews.byPerfume(perfumeId),
        (old: any) => {
          if (!old) {
 return old 
}

          return {
            ...old,
            reviews: (old.reviews || []).filter((review: any) => review.id !== reviewId),
            pagination: {
              ...old.pagination,
              totalCount: Math.max(
                0,
                (old.pagination?.totalCount || 0) - 1
              ),
            },
          }
        }
      )

      return { previousReviews }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousReviews && variables.perfumeId) {
        queryClient.setQueryData(
          queryKeys.reviews.byPerfume(variables.perfumeId),
          context.previousReviews
        )
      }
    },
    onSuccess: (data, variables) => {
      const { perfumeId } = variables

      // If perfumeId is provided, invalidate specific perfume review queries
      if (perfumeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.reviews.byPerfume(perfumeId),
          exact: false, // Include pagination variants
        })
        queryClient.invalidateQueries({
          queryKey: perfumeQueryKeys.perfumes.detail(perfumeId),
          exact: true,
        })
      }

      // Don't invalidate all reviews - too broad
    },
  })
}


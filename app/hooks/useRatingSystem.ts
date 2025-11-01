import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useCSRF } from "./useCSRF"
import { useErrorHandler } from "./useErrorHandler"

export interface RatingData {
  longevity?: number | null
  sillage?: number | null
  gender?: number | null
  priceValue?: number | null
  overall?: number | null
}

export interface UseRatingSystemOptions {
  perfumeId: string
  userId?: string | null
  initialRatings?: RatingData | null
  readonly?: boolean
  onError?: (error: string) => void
  onSuccess?: (ratings: RatingData) => void
}

export interface UseRatingSystemReturn {
  currentRatings: RatingData | null
  isLoggedIn: boolean
  isInteractive: boolean
  isSubmitting: boolean
  handleRatingChange: (category: keyof RatingData, rating: number) => void
  resetRatings: () => void
  categories: Array<{ key: keyof RatingData; label: string }>
}

/**
 * Custom hook for managing rating system state and interactions
 *
 * @param options - Configuration options for the rating system
 * @returns Rating system state and handlers
 */
export const useRatingSystem = ({
  perfumeId,
  userId,
  initialRatings = null,
  readonly = false,
  onError,
  onSuccess,
}: UseRatingSystemOptions): UseRatingSystemReturn => {
  const { t } = useTranslation()
  const { handleError } = useErrorHandler()
  const { addToHeaders } = useCSRF()

  const [currentRatings, setCurrentRatings] = useState<RatingData | null>(
    initialRatings
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoggedIn = Boolean(userId) && userId !== "anonymous"
  const isInteractive = isLoggedIn && !readonly

  // Update ratings when initial ratings change
  useEffect(() => {
    setCurrentRatings(initialRatings)
  }, [initialRatings])

  const handleRatingChange = useCallback(
    async (category: keyof RatingData, rating: number) => {
      if (!isInteractive || !userId || userId === "anonymous") {
        console.log("Cannot submit rating:", { isInteractive, userId })
        return
      }

      // Optimistic update
      const previousRatings = currentRatings
      setCurrentRatings((prev) => ({
        ...prev,
        [category]: rating,
      }))

      // Submit to server (same pattern as wishlist)
      const formData = new FormData()
      formData.append("perfumeId", perfumeId)
      formData.append("category", category)
      formData.append("rating", rating.toString())

      try {
        setIsSubmitting(true)
        const response = await fetch("/api/ratings", {
          method: "POST",
          headers: addToHeaders(),
          body: formData,
        })

        if (!response.ok) {
          // Revert on error
          setCurrentRatings(previousRatings)
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }))
          onError?.(errorData.error || "Failed to save rating")
          handleError(new Error(errorData.error || "Failed to save rating"), {
            context: { perfumeId, userId, category, rating },
          })
        } else {
          onSuccess?.({ ...previousRatings, [category]: rating })
        }
      } catch (error) {
        // Revert on error
        setCurrentRatings(previousRatings)
        onError?.("Failed to save rating")
        handleError(error as Error, {
          context: { perfumeId, userId, category, rating },
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      isInteractive,
      userId,
      perfumeId,
      currentRatings,
      addToHeaders,
      onError,
      onSuccess,
      handleError,
    ]
  )

  const resetRatings = useCallback(() => {
    setCurrentRatings(initialRatings)
  }, [initialRatings])

  const categories: Array<{ key: keyof RatingData; label: string }> = [
    { key: "longevity", label: t("singlePerfume.rating.categories.longevity") },
    { key: "sillage", label: t("singlePerfume.rating.categories.sillage") },
    { key: "gender", label: t("singlePerfume.rating.categories.gender") },
    {
      key: "priceValue",
      label: t("singlePerfume.rating.categories.priceValue"),
    },
    { key: "overall", label: t("singlePerfume.rating.categories.overall") },
  ]

  return {
    currentRatings,
    isLoggedIn,
    isInteractive,
    isSubmitting,
    handleRatingChange,
    resetRatings,
    categories,
  }
}

export default useRatingSystem

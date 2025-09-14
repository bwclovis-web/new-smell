import { useCallback, useEffect, useState } from 'react'
import { useFetcher } from 'react-router-dom'

import { useErrorHandler } from './useErrorHandler'

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
  onSuccess
}: UseRatingSystemOptions): UseRatingSystemReturn => {
  const fetcher = useFetcher()
  const { handleError } = useErrorHandler()

  const [currentRatings, setCurrentRatings] = useState<RatingData | null>(initialRatings)

  const isLoggedIn = Boolean(userId) && userId !== 'anonymous'
  const isInteractive = isLoggedIn && !readonly
  const isSubmitting = fetcher.state === 'submitting'

  // Update ratings when initial ratings change
  useEffect(() => {
    setCurrentRatings(initialRatings)
  }, [initialRatings])

  // Handle fetcher errors by reverting optimistic updates
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.error) {
      // Revert to original ratings on error
      setCurrentRatings(initialRatings)
      const errorMessage = fetcher.data.error
      onError?.(errorMessage)
      handleError(new Error(errorMessage), { context: { perfumeId, userId } })
    }
  }, [fetcher.state, fetcher.data, initialRatings, onError, handleError, perfumeId, userId])

  // Handle successful submission
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success && currentRatings) {
      onSuccess?.(currentRatings)
    }
  }, [fetcher.state, fetcher.data, currentRatings, onSuccess])

  const handleRatingChange = useCallback((
    category: keyof RatingData,
    rating: number
  ) => {
    if (!isInteractive) {
      return
    }

    // Optimistic update
    setCurrentRatings(prev => ({
      ...prev,
      [category]: rating
    }))

    // Submit to server
    const formData = new FormData()
    formData.append('userId', userId!)
    formData.append('perfumeId', perfumeId)
    formData.append('category', category)
    formData.append('rating', rating.toString())

    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/ratings'
    })
  }, [isInteractive, userId, perfumeId, fetcher])

  const resetRatings = useCallback(() => {
    setCurrentRatings(initialRatings)
  }, [initialRatings])

  const categories: Array<{ key: keyof RatingData; label: string }> = [
    { key: 'longevity', label: 'Longevity' },
    { key: 'sillage', label: 'Sillage' },
    { key: 'gender', label: 'Gender Appeal' },
    { key: 'priceValue', label: 'Price Value' },
    { key: 'overall', label: 'Overall Rating' }
  ]

  return {
    currentRatings,
    isLoggedIn,
    isInteractive,
    isSubmitting,
    handleRatingChange,
    resetRatings,
    categories
  }
}

export default useRatingSystem

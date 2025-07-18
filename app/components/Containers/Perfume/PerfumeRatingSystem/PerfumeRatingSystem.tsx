import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router-dom'

import SimpleNoirRating from '~/components/Atoms/SimpleNoirRating'

interface PerfumeRatingSystemProps {
  perfumeId: string
  userId?: string | null
  userRatings?: {
    longevity?: number | null
    sillage?: number | null
    gender?: number | null
    priceValue?: number | null
    overall?: number | null
  } | null
  averageRatings?: {
    longevity?: number | null
    sillage?: number | null
    gender?: number | null
    priceValue?: number | null
    overall?: number | null
    totalRatings: number
  } | null
  readonly?: boolean
}

const PerfumeRatingSystem = ({
  perfumeId,
  userId,
  userRatings = null,
  averageRatings = null,
  readonly = false
}: PerfumeRatingSystemProps) => {
  const fetcher = useFetcher()
  const [currentRatings, setCurrentRatings] = useState(userRatings)
  const isLoggedIn = Boolean(userId) && userId !== 'anonymous'
  const isInteractive = isLoggedIn && !readonly

  useEffect(() => {
    setCurrentRatings(userRatings)
  }, [userRatings])

  const handleRatingChange = (
    category: 'longevity' | 'sillage' | 'gender' | 'priceValue' | 'overall',
    rating: number
  ) => {
    if (!isInteractive) {
      return
    }
    console.log('handleRatingChange called:', { category, rating })
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
    console.log('Submitting rating to server:', { userId, perfumeId, category, rating })
    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/ratings'
    })
  }

  // Handle fetcher errors by reverting optimistic updates
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.error) {
      // Revert to original ratings on error
      setCurrentRatings(userRatings)
    }
  }, [fetcher.state, fetcher.data, userRatings])

  const categories = [
    { key: 'longevity' as const, label: 'Longevity' },
    { key: 'sillage' as const, label: 'Sillage' },
    { key: 'gender' as const, label: 'Gender Appeal' },
    { key: 'priceValue' as const, label: 'Price Value' },
    { key: 'overall' as const, label: 'Overall Rating' }
  ]

  return (
    <div className="bg-noir-dark/20 rounded-lg p-6">
      <h2 className="text-xl font-bold text-noir-gold mb-1 text-center">
        {isInteractive ? 'Rate This Perfume' : 'Community Ratings'}
      </h2>

      {!isLoggedIn && (
        <p className="text-sm text-noir-gold-500 mb-4 text-center">
          Please log in to rate this perfume
        </p>
      )}

      <div className="space-y-6">
        {categories.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center">
            <h4 className="text-sm font-medium text-noir-gold mb-2">
              {label}
            </h4>

            <div className="flex flex-col items-center gap-2">
              <SimpleNoirRating
                category={key}
                value={currentRatings?.[key]}
                onChange={(rating: number) => handleRatingChange(key, rating)}
                readonly={false}
                showLabel
              />

              <div className="text-xs text-noir-gold-100 text-center">
                {averageRatings && averageRatings[key] ? (
                  <>
                    Community Average: {averageRatings[key]?.toFixed(1)}/5
                    {averageRatings.totalRatings > 0 && (
                      <span className="ml-1">
                        ({averageRatings.totalRatings} vote{averageRatings.totalRatings !== 1 ? 's' : ''})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-noir-gold-100">Not yet rated</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {fetcher.state === 'submitting' && (
        <div className="mt-4 text-center">
          <p className="text-sm text-noir-gold-300">Saving your rating...</p>
        </div>
      )}

      {fetcher.state === 'idle' && fetcher.data?.error && (
        <div className="mt-4 text-center">
          <p className="text-sm text-red-400">Failed to save rating. Please try again.</p>
        </div>
      )}

      {fetcher.state === 'idle' && fetcher.data?.success && (
        <div className="mt-4 text-center">
          <p className="text-sm text-green-400">Rating saved successfully!</p>
        </div>
      )}
    </div>
  )
}

export default PerfumeRatingSystem

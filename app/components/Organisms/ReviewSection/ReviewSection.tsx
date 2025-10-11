import React, { useState, useEffect } from 'react'
import { useFetcher } from 'react-router'
import ReviewCard from '~/components/Molecules/ReviewCard'
import RichTextEditor from '~/components/Atoms/RichTextEditor'
import { styleMerge } from '~/utils/styleUtils'

interface Review {
  id: string
  review: string
  createdAt: string
  user: {
    id: string
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    email: string
  }
}

interface ReviewSectionProps {
  perfumeId: string
  currentUserId?: string
  currentUserRole?: string
  canCreateReview?: boolean
  existingUserReview?: Review | null
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  perfumeId,
  currentUserId,
  currentUserRole,
  canCreateReview = false,
  existingUserReview
}) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewContent, setReviewContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetcher = useFetcher()

  // Load reviews
  const loadReviews = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const response = await fetch(`/api/reviews?perfumeId=${perfumeId}&page=${pageNum}&limit=5`)
      const data = await response.json()

      if (data.reviews) {
        if (append) {
          setReviews(prev => [...prev, ...data.reviews])
        } else {
          setReviews(data.reviews)
        }
        setHasMore(data.pagination.hasNextPage)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [perfumeId])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadReviews(nextPage, true)
  }

  const handleCreateReview = async () => {
    if (!reviewContent.trim()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('_action', 'create')
      formData.append('perfumeId', perfumeId)
      formData.append('review', reviewContent)

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setReviewContent('')
        setShowReviewForm(false)
        // Reload reviews to show the new one
        loadReviews()
      } else {
        alert(result.error || 'Failed to create review')
      }
    } catch (error) {
      console.error('Error creating review:', error)
      alert('Failed to create review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditReview = async (reviewId: string) => {
    // This would open an edit modal or form
    // For now, we'll just show an alert
    alert('Edit functionality will be implemented')
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const formData = new FormData()
      formData.append('_action', 'delete')
      formData.append('reviewId', reviewId)

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Remove the review from the list
        setReviews(prev => prev.filter(review => review.id !== reviewId))
      } else {
        alert(result.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    }
  }

  const handleModerateReview = async (reviewId: string, isApproved: boolean) => {
    try {
      const formData = new FormData()
      formData.append('_action', 'moderate')
      formData.append('reviewId', reviewId)
      formData.append('isApproved', isApproved.toString())

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Reload reviews to reflect changes
        loadReviews()
      } else {
        alert(result.error || 'Failed to moderate review')
      }
    } catch (error) {
      console.error('Error moderating review:', error)
      alert('Failed to moderate review')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Reviews ({reviews.length})
        </h2>
        {canCreateReview && !existingUserReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-noir-gold text-noir-black rounded-md hover:bg-noir-gold/90 transition-colors"
          >
            Write Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white/5 border border-gray-300 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Write Your Review</h3>
          <RichTextEditor
            value={reviewContent}
            onChange={setReviewContent}
            placeholder="Share your thoughts about this perfume..."
            maxLength={2000}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateReview}
              disabled={!reviewContent.trim() || isSubmitting}
              className="px-4 py-2 bg-noir-gold text-noir-black rounded-md hover:bg-noir-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Existing User Review */}
      {existingUserReview && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Your Review</h3>
          <ReviewCard
            review={existingUserReview}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
          />
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
              onModerate={handleModerateReview}
              showModerationActions={currentUserRole === 'admin' || currentUserRole === 'editor'}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 text-noir-gold hover:text-noir-gold/80 transition-colors"
              >
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No reviews yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  )
}

export default ReviewSection

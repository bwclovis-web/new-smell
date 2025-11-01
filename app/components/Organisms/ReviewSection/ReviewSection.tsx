import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "~/components/Atoms/Button"
import RichTextEditor from "~/components/Atoms/RichTextEditor"
import ReviewCard from "~/components/Molecules/ReviewCard"
import { useCSRF } from "~/hooks/useCSRF"
import { safeAsync } from "~/utils/errorHandling.patterns"
import { sanitizeString } from "~/utils/validation"

interface Review {
  id: string
  review: string
  createdAt: string
  isApproved: boolean
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

const ReviewSection = ({
  perfumeId,
  currentUserId,
  currentUserRole,
  canCreateReview = false,
  existingUserReview,
}: ReviewSectionProps) => {
  const { t } = useTranslation()
  const { submitForm } = useCSRF()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewContent, setReviewContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load reviews
  const loadReviews = async (pageNum: number = 1, append: boolean = false) => {
    const [error, response] = await safeAsync(() => fetch(`/api/reviews?perfumeId=${perfumeId}&page=${pageNum}&limit=5&isApproved=true`))

    if (error) {
      console.error("Error loading reviews:", error)
      setLoading(false)
      return
    }

    const [jsonError, data] = await safeAsync(() => response.json())

    if (jsonError) {
      console.error("Error parsing reviews:", jsonError)
      setLoading(false)
      return
    }

    if (data.reviews) {
      if (append) {
        setReviews(prev => [...prev, ...data.reviews])
      } else {
        setReviews(data.reviews)
      }
      setHasMore(data.pagination.hasNextPage)
    }

    setLoading(false)
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
    const sanitizedReview = sanitizeString(reviewContent)

    if (!sanitizedReview.trim()) {
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("_action", "create")
    formData.append("perfumeId", perfumeId)
    formData.append("review", sanitizedReview)

    const [error, response] = await safeAsync(() => submitForm("/api/reviews", formData))

    if (error) {
      console.error(t("singlePerfume.review.failedToCreateReview"), error)
      alert(t("singlePerfume.review.failedToCreateReview"))
      setIsSubmitting(false)
      return
    }

    const [jsonError, result] = await safeAsync(() => response.json())

    if (jsonError) {
      console.error(t("singlePerfume.review.failedToCreateReview"), jsonError)
      alert(t("singlePerfume.review.failedToCreateReview"))
      setIsSubmitting(false)
      return
    }

    if (result.success) {
      setReviewContent("")
      setShowReviewForm(false)
      loadReviews()
    } else {
      alert(result.error || t("singlePerfume.review.failedToCreateReview"))
    }

    setIsSubmitting(false)
  }

  const handleEditReview = async (reviewId: string) => {
    alert(t("singlePerfume.review.editFunctionalityWillBeImplemented"))
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t("singlePerfume.review.deleteReviewConfirmation"))) {
      return
    }

    const formData = new FormData()
    formData.append("_action", "delete")
    formData.append("reviewId", reviewId)

    const [error, response] = await safeAsync(() => submitForm("/api/reviews", formData))

    if (error) {
      console.error(t("singlePerfume.review.failedToDeleteReview"), error)
      alert(t("singlePerfume.review.failedToDeleteReview"))
      return
    }

    const [jsonError, result] = await safeAsync(() => response.json())

    if (jsonError) {
      console.error(t("singlePerfume.review.failedToDeleteReview"), jsonError)
      alert(t("singlePerfume.review.failedToDeleteReview"))
      return
    }

    if (result.success) {
      // Remove the review from the list
      setReviews(prev => prev.filter(review => review.id !== reviewId))
    } else {
      alert(result.error || t("singlePerfume.review.failedToDeleteReview"))
    }
  }

  const handleModerateReview = async (reviewId: string, isApproved: boolean) => {
    // Optimistically remove the review from the list for real-time feel
    const originalReviews = [...reviews]
    setReviews(prev => prev.filter(review => review.id !== reviewId))

    const formData = new FormData()
    formData.append("_action", "moderate")
    formData.append("reviewId", reviewId)
    formData.append("isApproved", isApproved.toString())

    const [error, response] = await safeAsync(() => submitForm("/api/reviews", formData))

    if (error) {
      console.error(t("singlePerfume.review.failedToModerateReview"), error)
      setReviews(originalReviews)
      alert(t("singlePerfume.review.failedToModerateReview"))
      return
    }

    const [jsonError, result] = await safeAsync(() => response.json())

    if (jsonError || !result.success) {
      console.error(t("singlePerfume.review.failedToModerateReview"), jsonError)
      setReviews(originalReviews)
      alert(result?.error || t("singlePerfume.review.failedToModerateReview"))
      return
    }

    // If viewing all reviews (not just approved), reload to show updated status
    // Otherwise the optimistic removal is sufficient
    if (!window.location.search.includes("isApproved=false")) {
      // Review was removed optimistically and stays removed
      // Optionally reload to ensure consistency
      loadReviews()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 bg-noir-black/50 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {" "}
          {t("singlePerfume.review.heading")}
        </h2>
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
      <div className="flex items-center justify-between bg-noir-dark rounded-lg p-4">
        <h2 className="text-xl font-semibold">
          {t("singlePerfume.review.heading")} ({reviews.length})
        </h2>
        {canCreateReview && !existingUserReview && (
          <Button onClick={() => setShowReviewForm(true)}>
            {t("singlePerfume.review.writeReview")}
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="border border-noir-gold bg-noir-dark rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {t("singlePerfume.review.writeYourReview")}
          </h3>
          <RichTextEditor
            value={reviewContent}
            onChange={setReviewContent}
            placeholder={t("singlePerfume.review.addReviewPlaceholder")}
            maxLength={2000}
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={handleCreateReview}
              disabled={!reviewContent.trim() || isSubmitting}
              className="px-4 py-2 bg-noir-gold text-noir-black rounded-md hover:bg-noir-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? t("singlePerfume.review.submitting")
                : t("singlePerfume.review.submitReview")}
            </Button>
            <Button onClick={() => setShowReviewForm(false)} variant="secondary">
              {t("singlePerfume.review.cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Existing User Review */}
      {existingUserReview && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            {t("singlePerfume.review.yourReview")}
          </h3>
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
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
              onModerate={handleModerateReview}
              showModerationActions={
                currentUserRole === "admin" || currentUserRole === "editor"
              }
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 text-noir-gold hover:text-noir-gold/80 transition-colors"
              >
                {t("singlePerfume.review.loadMoreReviews")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-lg py-8 text-noir-gold">
          <p>{t("singlePerfume.review.noReviews")}</p>
        </div>
      )}
    </div>
  )
}

export default ReviewSection

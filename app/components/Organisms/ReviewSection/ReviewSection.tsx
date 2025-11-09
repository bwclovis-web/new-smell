import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "~/components/Atoms/Button"
import RichTextEditor from "~/components/Atoms/RichTextEditor"
import ReviewCard from "~/components/Molecules/ReviewCard"
import { useCSRF } from "~/hooks/useCSRF"
import { usePerfumeReviews } from "~/hooks/usePerfumeReviews"
import {
  useCreateReview,
  useDeleteReview,
} from "~/lib/mutations/reviews"
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
  const [page, setPage] = useState(1)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewContent, setReviewContent] = useState("")
  
  // Use TanStack Query for reviews
  const { data: reviewsData, isLoading: loading, refetch } = usePerfumeReviews(perfumeId, { page, limit: 5 })
  // Extract reviews from data
  const reviews = reviewsData?.reviews || []
  const hasMore = reviewsData?.pagination?.hasNextPage ?? false
  
  // Mutations
  const createReview = useCreateReview()
  const deleteReview = useDeleteReview()

  const handleLoadMore = () => {
    // For now, pagination is handled by the query
    // TODO: Convert to infinite query for better pagination support
    setPage(prev => prev + 1)
  }

  const handleCreateReview = async () => {
    const sanitizedReview = sanitizeString(reviewContent)

    if (!sanitizedReview.trim()) {
      return
    }

    // Use mutation with optimistic update
    createReview.mutate(
      {
        perfumeId,
        review: sanitizedReview,
      },
      {
        onSuccess: () => {
          setReviewContent("")
          setShowReviewForm(false)
          // Refetch reviews to show new review
          refetch()
        },
        onError: error => {
          alert(error instanceof Error
              ? error.message
              : t("singlePerfume.review.failedToCreateReview"))
        },
      }
    )
  }

  const handleEditReview = async (reviewId: string) => {
    alert(t("singlePerfume.review.editFunctionalityWillBeImplemented"))
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t("singlePerfume.review.deleteReviewConfirmation"))) {
      return
    }

    // Use mutation with optimistic update
    deleteReview.mutate(
      {
        reviewId,
        perfumeId, // Include for proper query invalidation
      },
      {
        onSuccess: () => {
          // Refetch reviews to reflect deletion
          refetch()
        },
        onError: error => {
          alert(error instanceof Error
              ? error.message
              : t("singlePerfume.review.failedToDeleteReview"))
        },
      }
    )
  }

  const { submitForm } = useCSRF()

  const handleModerateReview = async (reviewId: string, isApproved: boolean) => {
    // For moderation, we still use the old pattern since there's no mutation yet
    // TODO: Create useModerateReview mutation with optimistic updates
    const formData = new FormData()
    formData.append("_action", "moderate")
    formData.append("reviewId", reviewId)
    formData.append("isApproved", isApproved.toString())

    const [error, response] = await safeAsync(() => submitForm("/api/reviews", formData))

    if (error) {
      console.error(t("singlePerfume.review.failedToModerateReview"), error)
      alert(t("singlePerfume.review.failedToModerateReview"))
      return
    }

    const [jsonError, result] = await safeAsync(() => response.json())

    if (jsonError || !result.success) {
      console.error(t("singlePerfume.review.failedToModerateReview"), jsonError)
      alert(result?.error || t("singlePerfume.review.failedToModerateReview"))
      return
    }

    // Refetch reviews after moderation
    refetch()
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
              disabled={!reviewContent.trim() || createReview.isPending}
              className="px-4 py-2 bg-noir-gold text-noir-black rounded-md hover:bg-noir-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createReview.isPending
                ? t("singlePerfume.review.submitting")
                : t("singlePerfume.review.submitReview")}
            </Button>
            <Button 
              onClick={() => setShowReviewForm(false)} 
              variant="secondary"
              disabled={createReview.isPending}
            >
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

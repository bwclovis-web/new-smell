import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { styleMerge } from '~/utils/styleUtils'

interface ReviewCardProps {
  review: {
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
  currentUserId?: string
  currentUserRole?: string
  onEdit?: (reviewId: string) => void
  onDelete?: (reviewId: string) => void
  onModerate?: (reviewId: string, isApproved: boolean) => void
  showModerationActions?: boolean
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
  onModerate,
  showModerationActions = false
}) => {
  const isOwner = currentUserId === review.user.id
  const canModerate = currentUserRole === 'admin' || currentUserRole === 'editor'
  const canEdit = isOwner || canModerate
  const canDelete = isOwner || canModerate

  const getDisplayName = () => {
    if (review.user.username) {
      return review.user.username
    }
    if (review.user.firstName && review.user.lastName) {
      return `${review.user.firstName} ${review.user.lastName}`
    }
    if (review.user.firstName) {
      return review.user.firstName
    }
    // Show email as fallback
    return review.user.email
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className={styleMerge("bg-white/5 border border-gray-300 rounded-lg p-4 space-y-3")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-noir-gold/20 rounded-full flex items-center justify-center">
            <span className="text-noir-gold text-sm font-semibold">
              {getDisplayName().charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
            <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center space-x-2">
            {isOwner && onEdit && (
              <button
                onClick={() => onEdit(review.id)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Edit
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="text-xs text-red-600 hover:text-red-800 hover:underline"
              >
                Delete
              </button>
            )}
            {showModerationActions && canModerate && onModerate && (
              <div className="flex space-x-1">
                <button
                  onClick={() => onModerate(review.id, true)}
                  className="text-xs text-green-600 hover:text-green-800 hover:underline"
                >
                  Approve
                </button>
                <button
                  onClick={() => onModerate(review.id, false)}
                  className="text-xs text-orange-600 hover:text-orange-800 hover:underline"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Content */}
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: review.review }}
      />

      {/* Moderation Status */}
      {showModerationActions && (
        <div className="text-xs text-gray-500">
          Status: <span className="font-medium">Pending Review</span>
        </div>
      )}
    </div>
  )
}

export default ReviewCard

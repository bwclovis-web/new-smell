import type { Comment } from "~/types/comments"

/**
 * Helper function to append comment data to form data
 */
const appendCommentData = (formData: FormData, params: {
  commentText?: string
  commentId?: string
  perfumeId: string
  userPerfumeId: string
  isPublic?: boolean
}) => {
  if (params.commentText) {
    formData.append('comment', params.commentText)
  }

  if (params.commentId) {
    formData.append('commentId', params.commentId)
  }

  formData.append('perfumeId', params.perfumeId)
  formData.append('userPerfumeId', params.userPerfumeId)

  if (params.isPublic !== undefined) {
    formData.append('isPublic', params.isPublic.toString())
  }
}

/**
 * Utility function to create a form data object for comment operations
 */
export const createCommentFormData = (
  action: 'add-comment' | 'toggle-comment-visibility' | 'delete-comment',
  params: {
    commentText?: string
    commentId?: string
    perfumeId: string
    userPerfumeId: string
    isPublic?: boolean
  },
  csrfToken?: string
) => {
  const formData = new FormData()
  appendCommentData(formData, params)
  formData.append('action', action)

  // Add CSRF token if provided
  if (csrfToken) {
    formData.append('_csrf', csrfToken)
  }

  return formData
}

/**
 * Create a temporary comment object for local state updates before backend sync
 */
export const createTemporaryComment = (
  commentText: string,
  isPublic: boolean,
  userPerfumeId?: string
): Comment => ({
  id: `temp-${userPerfumeId || 'unknown'}-${Date.now()}`, // More unique temporary ID
  userId: 'temp-user', // Temporary userId
  perfumeId: 'temp-perfume', // Temporary perfumeId
  userPerfumeId: userPerfumeId || 'temp-user-perfume',
  comment: commentText,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPublic
})

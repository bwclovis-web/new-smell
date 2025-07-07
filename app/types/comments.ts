import type { UserPerfumeI } from '~/types'

export interface Comment {
  id: string
  comment: string
  createdAt: string
  isPublic: boolean
}

export interface CommentsModalProps {
  perfume: UserPerfumeI

  onCommentAdded?: (comment: Comment) => void
}

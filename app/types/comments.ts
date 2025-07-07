import type { UserPerfumeI } from '~/types'

export interface Comment {
  id: string
  comment: string
  createdAt: string
  isPublic: boolean
}

export interface PerfumeWithComments extends UserPerfumeI {
  comments?: Comment[]
}

export interface CommentsModalProps {
  perfume: UserPerfumeI

  onCommentAdded?: (comment: Comment) => void
}

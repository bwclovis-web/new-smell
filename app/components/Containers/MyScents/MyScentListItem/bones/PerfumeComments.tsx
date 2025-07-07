import { useContext, useEffect, useState } from "react"
import { useFetcher } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import CheckBox from "~/components/Atoms/CheckBox/CheckBox"
import Modal from "~/components/Organisms/Modal/Modal"
import SessionContext from "~/providers/sessionProvider"
import type { Comment, PerfumeWithComments } from "~/types/comments"
import { createCommentFormData } from "~/utils/comment-utils"

import CommentsModal from "../../CommentsModal/CommentsModal"

interface PerfumeCommentsProps {
  userPerfume: PerfumeWithComments
}

const PerfumeComments = ({ userPerfume }: PerfumeCommentsProps) => {
  const { modalOpen, toggleModal, modalId } = useContext(SessionContext)
  const fetcher = useFetcher()
  const [comments, setComments] = useState<Comment[]>([])
  const uniqueModalId = `add-scent-${userPerfume.id}`

  useEffect(() => {
    if (userPerfume.comments) {
      setComments(userPerfume.comments)
    }
  }, [userPerfume.comments])

  // Handle toggling the public/private status of a comment
  const handleTogglePublic = (commentId: string, currentIsPublic: boolean) => {
    setComments(prevComments => prevComments.map(comment => comment.id === commentId
      ? { ...comment, isPublic: !currentIsPublic }
      : comment))
    const perfumeId = userPerfume.perfumeId || userPerfume.perfume?.id
    const userPerfumeId = userPerfume.id

    if (!perfumeId || !userPerfumeId) {
      return
    }

    // Send to server using the shared utility function
    const formData = createCommentFormData('toggle-comment-visibility', {
      commentId,
      perfumeId,
      userPerfumeId,
      isPublic: !currentIsPublic
    })

    fetcher.submit(formData, {
      method: 'post',
      action: '/api/user-perfumes'
    })
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
    const perfumeId = userPerfume.perfumeId || userPerfume.perfume?.id
    const userPerfumeId = userPerfume.id

    if (!perfumeId || !userPerfumeId) {
      return
    }

    const formData = createCommentFormData('delete-comment', {
      commentId,
      perfumeId,
      userPerfumeId
    })

    fetcher.submit(formData, {
      method: 'post',
      action: '/api/user-perfumes'
    })
  }

  return (
    <div className="mt-4 bg-noir-light text-noir-dark p-4 shadow-lg border border-noir-dark/90 dark:border-noir-light/90 rounded-md">
      <h3 className="text-xl  text-noir-dark">Comments</h3>
      {comments.length > 0 ? (
        <ul className="list-disc pl-5">
          {comments.map(comment => (
            <li key={comment.id} className="mb-1 border-b border-noir-dark/20 dark:border-noir-light/90 pb-2">
              <p className="text-base">
                {comment.comment}
              </p>
              <div className="flex items-center justify-between mt-1 bg-noir-blue/10 p-2 rounded-md">
                <span className="text-xs text-noir-gray font-bold tracking-wide">
                  Created on : {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                <CheckBox
                  checked={comment.isPublic}
                  label="Public"
                  onChange={() => handleTogglePublic(comment.id, comment.isPublic)}
                />
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-noir-dark mb-2">No comments yet.</p>
      )}
      <Button
        className="mt-2"
        onClick={() => {
          const buttonRef = { current: document.createElement('button') }
          toggleModal(buttonRef as any, uniqueModalId, 'create')
        }}
        size={'sm'}> Create Comment</Button>

      {modalOpen && modalId === uniqueModalId && (
        <Modal>
          <CommentsModal
            perfume={userPerfume}
            onCommentAdded={newComment => {
              setComments(prev => [newComment, ...prev])
            }}
          />
        </Modal>
      )}
    </div>
  )
}

export default PerfumeComments

import { useContext, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { MdDeleteForever } from "react-icons/md"
import { useFetcher } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import CheckBox from "~/components/Atoms/CheckBox/CheckBox"
import Modal from "~/components/Organisms/Modal/Modal"
import { useSessionStore } from '~/stores/sessionStore'
import type { UserPerfumeI } from "~/types"
import type { Comment } from "~/types/comments"
import { createCommentFormData } from "~/utils/comment-utils"
import { FORM_DATA_ACTIONS } from "~/utils/constants"

import CommentsModal from "../../CommentsModal/CommentsModal"

interface PerfumeCommentsProps {
  userPerfume: UserPerfumeI
}
const PerfumeComments = ({ userPerfume }: PerfumeCommentsProps) => {
  const { t } = useTranslation()
  const { toggleModal, modalId } = useSessionStore()
  const fetcher = useFetcher()
  const [comments, setComments] = useState<Comment[]>([])
  const uniqueModalId = `add-scent-${userPerfume.id}`

  useEffect(() => {
    if (userPerfume.comments) {
      setComments(userPerfume.comments)
    }
  }, [userPerfume.comments])
  const handleTogglePublic = (commentId: string, currentIsPublic: boolean) => {
    setComments(prevComments => prevComments.map(comment => comment.id === commentId
      ? { ...comment, isPublic: !currentIsPublic }
      : comment))
    const perfumeId = userPerfume.perfumeId || userPerfume.perfume?.id
    const userPerfumeId = userPerfume.id

    if (!perfumeId || !userPerfumeId) {
      return
    }

    const formData = createCommentFormData(
      FORM_DATA_ACTIONS.TOGGLE_COMMENT_VISIBILITY,
      {
        commentId,
        perfumeId,
        userPerfumeId,
        isPublic: !currentIsPublic
      }
    )

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

    const formData = createCommentFormData(FORM_DATA_ACTIONS.DELETE_COMMENT, {
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
    <div className="mt1 p-4  rounded-md">
      <h3 className="text-lg font-semibold">
        {t('myScents.comments.heading')}
      </h3>
      <p className="text-sm  mb-2">
        {t('myScents.comments.subheading', { perfumeName: userPerfume.perfume.name })}
      </p>
      {comments.length > 0 ? (
        <ul className="list-disc pl-5">
          {comments.map(comment => (
            <li key={comment.id} className="mb-1 border-b border-noir-dark/20 dark:border-noir-light/90 pb-2 bg-noir-light">
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
                <Button
                  variant="icon"
                  onClick={() => handleDeleteComment(comment.id)}
                  background={'red'}
                >
                  <span className="text-white/90 font-bold text-sm">Delete comment</span>
                  <MdDeleteForever size={20} fill="white" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-noir-dark mb-2">{t('myScents.comments.noComments')}</p>
      )}
      <Button
        className="mt-2"
        onClick={() => {
          const buttonRef = { current: document.createElement('button') }
          toggleModal(buttonRef as any, uniqueModalId, 'create')
        }}
        size={'sm'}>{t('myScents.comments.addCommentButton')}</Button>

      {modalOpen && modalId === uniqueModalId && (
        <Modal
          innerType="dark"
          animateStart="left"
        >
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

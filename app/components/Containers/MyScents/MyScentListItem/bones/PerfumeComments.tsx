import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { MdDeleteForever } from "react-icons/md"

import { Button } from "~/components/Atoms/Button"
import VooDooCheck from "~/components/Atoms/VooDooCheck/VooDooCheck"
import Modal from "~/components/Organisms/Modal"
import { useCSRF } from "~/hooks/useCSRF"
import { useSessionStore } from "~/stores/sessionStore"
import type { UserPerfumeI } from "~/types"
import type { Comment } from "~/types/comments"
import { safeAsync } from "~/utils/errorHandling.patterns"
import { assertExists } from "~/utils/errorHandling.patterns"

import CommentsModal from "../../CommentsModal/CommentsModal"

interface PerfumeCommentsProps {
  userPerfume: UserPerfumeI
}
const PerfumeComments = ({ userPerfume }: PerfumeCommentsProps) => {
  const { t } = useTranslation()
  const { toggleModal, modalId, modalOpen } = useSessionStore()
  const { submitForm } = useCSRF()
  const [comments, setComments] = useState<Comment[]>([])
  const uniqueModalId = `add-scent-${userPerfume.id}`

  useEffect(() => {
    if (userPerfume.comments) {
      setComments(userPerfume.comments)
    }
  }, [userPerfume.comments])
  const handleTogglePublic = async (commentId: string, currentIsPublic: boolean) => {
    // Optimistically update UI
    setComments(prevComments => prevComments.map(comment => comment.id === commentId
          ? { ...comment, isPublic: !currentIsPublic }
          : comment))

    // Validate required IDs exist
    const perfumeId = assertExists(
      userPerfume.perfumeId || userPerfume.perfume?.id,
      "Perfume ID",
      { userPerfumeId: userPerfume.id }
    )
    const userPerfumeId = assertExists(userPerfume.id, "User Perfume ID", {
      perfumeId,
    })

    const formData = new FormData()
    formData.append("action", "toggle-comment-visibility")
    formData.append("commentId", commentId)
    formData.append("perfumeId", perfumeId)
    formData.append("userPerfumeId", userPerfumeId)
    formData.append("isPublic", (!currentIsPublic).toString())

    // Use safeAsync for error handling
    const [error, response] = await safeAsync(() => submitForm("/api/user-perfumes", formData))

    if (error) {
      console.error("Error toggling comment visibility:", error)
      // Revert the UI change on error
      setComments(prevComments => prevComments.map(comment => comment.id === commentId
            ? { ...comment, isPublic: currentIsPublic }
            : comment))
      return
    }

    const [jsonError, result] = await safeAsync(() => response.json())

    if (jsonError || !result.success) {
      console.error(
        "Failed to toggle comment visibility:",
        jsonError || result.error
      )
      // Revert the UI change on error
      setComments(prevComments => prevComments.map(comment => comment.id === commentId
            ? { ...comment, isPublic: currentIsPublic }
            : comment))
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const originalComments = [...comments]
    // Optimistically remove from UI
    setComments(prev => prev.filter(comment => comment.id !== commentId))

    // Validate required IDs exist
    const perfumeId = assertExists(
      userPerfume.perfumeId || userPerfume.perfume?.id,
      "Perfume ID",
      { userPerfumeId: userPerfume.id }
    )
    const userPerfumeId = assertExists(userPerfume.id, "User Perfume ID", {
      perfumeId,
    })

    const formData = new FormData()
    formData.append("action", "delete-comment")
    formData.append("commentId", commentId)
    formData.append("perfumeId", perfumeId)
    formData.append("userPerfumeId", userPerfumeId)

    // Use safeAsync for error handling
    const [error, response] = await safeAsync(() => submitForm("/api/user-perfumes", formData))

    if (error) {
      console.error("Error deleting comment:", error)
      setComments(originalComments)
      alert(t("comments.deleteError", "Error deleting comment"))
      return
    }

    const [jsonError, result] = await safeAsync(() => response.json())

    if (jsonError || !result.success) {
      console.error("Failed to delete comment:", jsonError || result.error)
      setComments(originalComments)
      alert(`${t("comments.deleteFailed", "Failed to delete comment")}: ${
          result?.error || "Unknown error"
        }`)
    }
  }

  return (
    <div className="mt1 p-4  rounded-md">
      <h3 className="text-lg font-semibold">{t("myScents.comments.heading")}</h3>
      <p className="text-sm  mb-2">
        {t("myScents.comments.subheading", {
          perfumeName: userPerfume.perfume.name,
        })}
      </p>
      {comments.length > 0 ? (
        <ul className="list-disc pl-5">
          {comments.map(comment => (
            <li
              key={comment.id}
              className="mb-1 border-b border-noir-dark/20 dark:border-noir-light/90 pb-2 bg-noir-light"
            >
              <p className="text-base">{comment.comment}</p>
              <div className="flex items-center justify-between mt-1 bg-noir-blue/10 p-2 rounded-md">
                <span className="text-xs text-noir-gray font-bold tracking-wide">
                  Created on : {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                <VooDooCheck
                  checked={comment.isPublic}
                  labelChecked={t("comments.makePublic", "Make this comment public")}
                  labelUnchecked={t(
                    "comments.makePrivate",
                    "Make this comment private"
                  )}
                  onChange={() => handleTogglePublic(comment.id, comment.isPublic)}
                />
                <Button
                  variant="icon"
                  onClick={() => handleDeleteComment(comment.id)}
                  background={"red"}
                >
                  <span className="text-white/90 font-bold text-sm">
                    Delete comment
                  </span>
                  <MdDeleteForever size={20} fill="white" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-noir-dark mb-2">
          {t("myScents.comments.noComments")}
        </p>
      )}
      <Button
        className="mt-2"
        onClick={() => {
          const buttonRef = { current: document.createElement("button") }
          toggleModal(buttonRef as any, uniqueModalId, "create")
        }}
        size={"sm"}
      >
        {t("myScents.comments.addCommentButton")}
      </Button>

      {modalOpen && modalId === uniqueModalId && (
        <Modal innerType="dark" animateStart="bottom">
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

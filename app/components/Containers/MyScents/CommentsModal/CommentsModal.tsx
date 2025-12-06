import type { FormEvent } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "~/components/Atoms/Button/Button"
import VooDooCheck from "~/components/Atoms/VooDooCheck/VooDooCheck"
import { useCSRF } from "~/hooks/useCSRF"
import { useSessionStore } from "~/stores/sessionStore"
import type { CommentsModalProps } from "~/types/comments"
import { createTemporaryComment } from "~/utils/comment-utils"
import { safeAsync } from "~/utils/errorHandling.patterns"
import { commentSchemas, sanitizeString } from "~/utils/validation"

const CommentsModal = ({ perfume, onCommentAdded }: CommentsModalProps) => {
  const { t } = useTranslation()
  const { toggleModal, modalId } = useSessionStore()
  const { submitForm } = useCSRF()
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comment, setComment] = useState("")

  const closeModal = () => {
    const buttonRef = { current: document.createElement("button") }
    toggleModal(buttonRef as any, modalId || "add-scent")
    setIsSubmitting(false)
    setIsPublic(false)
    setComment("")
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)

    // Sanitize input
    const sanitizedComment = sanitizeString(comment)

    // Validate comment data
    const validationData = {
      perfumeId: perfume.perfumeId || perfume.perfume?.id || "",
      userPerfumeId: perfume.id,
      comment: sanitizedComment,
      isPublic,
    }

    const validationResult = commentSchemas.create.safeParse(validationData)

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.errors[0]?.message || "Invalid comment data"
      alert(errorMessage)
      setIsSubmitting(false)
      return
    }

    // Add temporary comment to UI immediately
    if (onCommentAdded) {
      onCommentAdded(createTemporaryComment(sanitizedComment, isPublic, perfume.id))
    }

    // Create form data with validated data
    const formData = new FormData()
    formData.append("action", "add-comment")
    formData.append("perfumeId", validationResult.data.perfumeId)
    formData.append("userPerfumeId", validationResult.data.userPerfumeId)
    formData.append(
      "isPublic",
      validationResult.data.isPublic?.toString() || "false"
    )
    formData.append("comment", validationResult.data.comment)

    // Use safeAsync for error handling
    const [error, response] = await safeAsync(() => submitForm("/api/user-perfumes", formData))

    if (error) {
      console.error("Error submitting comment:", error)
      alert(t("comments.error", "Error submitting comment. Please try again."))
      setIsSubmitting(false)
      return
    }

    const [jsonError, result] = await safeAsync(() => response.json())

    if (jsonError) {
      console.error("Error parsing response:", jsonError)
      alert(t("comments.error", "Error processing response. Please try again."))
      setIsSubmitting(false)
      return
    }

    if (result.success) {
      setTimeout(() => {
        closeModal()
      }, 1000)
    } else {
      console.error("Failed to add comment:", result.error)
      alert(`${t("comments.failed", "Failed to add comment")}: ${result.error}`)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4">
      <h2>{t("comments.title", "Comments")}</h2>
      <p className="mb-4 text-xl text-noir-gold-100">
        {t(
          "comments.description",
          "This is where you can add your personal comments about the scents."
        )}
      </p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label
          htmlFor="comment"
          className="block text-md font-medium text-noir-gold-500"
        >
          {t("comments.addLabel", "Add a comment:")}
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          className="block w-full noir-border p-2 relative resize-none bg-noir-gold-500/10 text-noir-gold-100 
          focus:bg-noir-gold/40 focus:ring-noir-gold focus:border-noir-gold"
          required
        />

        <div className="flex items-center gap-2">
          <VooDooCheck
            id="isPublic"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
            labelChecked={t("comments.makePublic", "Make this comment public")}
            labelUnchecked={t("comments.makePrivate", "Make this comment private")}
          />
        </div>

        <Button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting
            ? t("comments.submitting", "Submitting...")
            : t("comments.submit", "Submit")}
        </Button>
      </form>
    </div>
  )
}

export default CommentsModal

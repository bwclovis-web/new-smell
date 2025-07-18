import type { FormEvent } from "react"
import { useContext, useState } from "react"
import { useTranslation } from "react-i18next"
import { Form, useFetcher } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import SessionContext from "~/providers/sessionProvider"
import type { CommentsModalProps } from "~/types/comments"
import { createCommentFormData, createTemporaryComment } from "~/utils/comment-utils"

const CommentsModal = ({ perfume, onCommentAdded }: CommentsModalProps) => {
  const { t } = useTranslation()
  const { toggleModal, modalId } = useContext(SessionContext)
  const [isPublic, setIsPublic] = useState(false)
  const fetcher = useFetcher()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePostSubmission = (commentText: string) => {
    if (onCommentAdded) {
      onCommentAdded(createTemporaryComment(commentText, isPublic, perfume.id))
    }

    // Close the modal after submission
    setTimeout(() => {
      const buttonRef = { current: document.createElement('button') }
      toggleModal(buttonRef as any, modalId || 'add-scent')
      setIsSubmitting(false)
    }, 500)
  }

  // Prepare form data for comment submission
  const prepareCommentData = (form: HTMLFormElement) => {
    const formData = new FormData(form)
    const commentText = formData.get('comment') as string
    const perfumeId = perfume.perfumeId || perfume.perfume?.id
    const userPerfumeId = perfume.id

    if (!perfumeId || !userPerfumeId) {
      throw new Error('Missing required IDs for comment')
    }

    // Create and submit form data
    return {
      formData: createCommentFormData('add-comment', {
        commentText,
        perfumeId,
        userPerfumeId,
        isPublic
      }),
      commentText
    }
  }

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    setIsSubmitting(true)

    try {
      const form = evt.currentTarget as HTMLFormElement
      const { formData: commentFormData, commentText } = prepareCommentData(form)

      fetcher.submit(commentFormData, {
        method: 'post',
        action: '/api/user-perfumes'
      })

      handlePostSubmission(commentText)
    } catch {
      // Handle error silently
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4">
      <h2>{t('comments.title', 'Comments')}</h2>
      <p className="mb-4 text-xl text-noir-gold-100">{t('comments.description', 'This is where you can add your personal comments about the scents.')}</p>
      <Form method="post" className="space-y-3" onSubmit={handleSubmit}>
        <label htmlFor="comment" className="block text-md font-medium text-noir-gold-500">
          {t('comments.addLabel', 'Add a comment:')}
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="block w-full noir-border p-2 relative resize-none bg-noir-gold-500/10 text-noir-gold-100 
          focus:bg-noir-gold/40 focus:ring-noir-gold focus:border-noir-gold"
          required
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
            className="h-6 w-6"
          />
          <label htmlFor="isPublic" className="text-md text-noir-gold-100">
            {t('comments.makePublic', 'Make this comment public')}
          </label>
        </div>

        <Button
          type="submit"
          className="btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('comments.submitting', 'Submitting...') : t('comments.submit', 'Submit')}
        </Button>
      </Form>
    </div>
  )
}

export default CommentsModal

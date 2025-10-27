import type { FormEvent } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "~/components/Atoms/Button/Button"
import VooDooCheck from "~/components/Atoms/VooDooCheck/VooDooCheck"
import { useCSRF } from "~/hooks/useCSRF"
import { useSessionStore } from '~/stores/sessionStore'
import type { CommentsModalProps } from "~/types/comments"
import { createTemporaryComment } from "~/utils/comment-utils"

const CommentsModal = ({ perfume, onCommentAdded }: CommentsModalProps) => {
  const { t } = useTranslation()
  const { toggleModal, modalId } = useSessionStore()
  const { submitForm } = useCSRF()
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comment, setComment] = useState('')

  const closeModal = () => {
    const buttonRef = { current: document.createElement('button') }
    toggleModal(buttonRef as any, modalId || 'add-scent')
    setIsSubmitting(false)
    setIsPublic(false)
    setComment('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!comment.trim()) {
      alert('Please enter a comment')
      return
    }

    setIsSubmitting(true)

    try {
      // Add temporary comment to UI immediately
      if (onCommentAdded) {
        onCommentAdded(createTemporaryComment(comment, isPublic, perfume.id))
      }

      // Create form data manually
      const formData = new FormData()
      formData.append('action', 'add-comment')
      formData.append('perfumeId', perfume.perfumeId || perfume.perfume?.id || '')
      formData.append('userPerfumeId', perfume.id)
      formData.append('isPublic', isPublic.toString())
      formData.append('comment', comment)

      console.log('Submitting comment with data:')
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`)
      }

      // Use useCSRF's submitForm method which handles CSRF automatically
      const response = await submitForm('/api/user-perfumes', formData)
      const result = await response.json()
      console.log('Server response:', result)

      if (result.success) {
        console.log('Comment added successfully!')
        setTimeout(() => {
          closeModal()
        }, 1000)
      } else {
        console.error('Failed to add comment:', result.error)
        alert(`Failed to add comment: ${result.error}`)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Error submitting comment')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4">
      <h2>{t('comments.title', 'Comments')}</h2>
      <p className="mb-4 text-xl text-noir-gold-100">{t('comments.description', 'This is where you can add your personal comments about the scents.')}</p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label htmlFor="comment" className="block text-md font-medium text-noir-gold-500">
          {t('comments.addLabel', 'Add a comment:')}
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
            labelChecked={t('comments.makePublic', 'Make this comment public')}
            labelUnchecked={t('comments.makePrivate', 'Make this comment private')}
          />
        </div>

        <Button
          type="submit"
          className="btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('comments.submitting', 'Submitting...') : t('comments.submit', 'Submit')}
        </Button>
      </form>
    </div>
  )
}

export default CommentsModal

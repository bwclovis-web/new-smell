import type { FormEvent } from "react"
import { useContext, useState } from "react"
import { useTranslation } from "react-i18next"
import { Form, useFetcher } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import SessionContext from "~/providers/sessionProvider"
import type { UserPerfumeI } from "~/types"

interface CommentsModalProps {
  perfume: UserPerfumeI
}

const CommentsModal = ({ perfume }: CommentsModalProps) => {
  const { t } = useTranslation()
  const { toggleModal, modalId } = useContext(SessionContext)
  const [isPublic, setIsPublic] = useState(false)
  const fetcher = useFetcher()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(evt.currentTarget as HTMLFormElement)
    formData.append('perfumeId', perfume.perfume.id)
    formData.append('userPerfumeId', perfume.id)
    formData.append('action', 'add-comment')
    formData.append('isPublic', isPublic ? 'true' : 'false')

    fetcher.submit(formData, {
      method: 'post',
      action: '/api/user-perfumes'
    })

    // Close the modal after submission
    setTimeout(() => {
      // Create a button element to use as a trigger for toggling modal
      const buttonRef = { current: document.createElement('button') }
      toggleModal(buttonRef as any, modalId || 'add-scent')
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="p-4 bg-noir-light rounded-md">
      <h2 className="text-xl font-bold mb-2">{t('comments.title', 'Comments')}</h2>
      <p className="mb-4">{t('comments.description', 'This is where you can add your personal comments about the scents.')}</p>

      <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
        <label htmlFor="comment" className="block text-sm font-medium text-noir-dark">
          {t('comments.addLabel', 'Add a comment:')}
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="block w-full border border-noir-dark/90 dark:border-noir-light/90 rounded-md p-2"
          required
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
            className="h-4 w-4"
          />
          <label htmlFor="isPublic" className="text-sm">
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

import { useContext } from "react"

import { Button } from "~/components/Atoms/Button/Button"
import Modal from "~/components/Organisms/Modal/Modal"
import SessionContext from "~/providers/sessionProvider"
import type { UserPerfumeI } from "~/types"

import CommentsModal from "../../CommentsModal/CommentsModal"

interface Comment {
  id: string
  content: string
  createdAt: string
}

interface PerfumeWithComments extends UserPerfumeI {
  comments?: Comment[]
}

interface PerfumeCommentsProps {
  userPerfume: PerfumeWithComments
}

const PerfumeComments = ({ userPerfume }: PerfumeCommentsProps) => {
  const { modalOpen, toggleModal, modalId } = useContext(SessionContext)
  return (
    <div className="mt-4 bg-noir-light text-noir-dark p-4 shadow-lg border border-noir-dark/90 dark:border-noir-light/90 rounded-md">
      <h4 className="text-xl font-bold text-noir-dark">Comments</h4>
      {userPerfume.comments && userPerfume.comments.length > 0 ? (
        <ul className="list-disc pl-5">
          {userPerfume.comments.map(comment => (
            <li key={comment.id} className="mb-2">
              <p className="text-sm">{comment.content}</p>
              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-noir-dark mb-2">No comments yet.</p>
      )}
      <Button
        onClick={() => {
          // Create a button element to use as a trigger
          const buttonRef = { current: document.createElement('button') }
          toggleModal(buttonRef as any, 'add-scent', 'create')
        }}
        size={'sm'}> Create Comment</Button>

      {modalOpen && modalId === 'add-scent' && (
        <Modal>
          <CommentsModal perfume={userPerfume} />
        </Modal>
      )}
    </div>
  )
}

export default PerfumeComments

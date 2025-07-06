import { use, useRef } from "react"

import { Button } from "~/components/Atoms/Button/Button"
import Modal from "~/components/Organisms/Modal/Modal"
import SessionContext from "~/providers/sessionProvider"
import perfume from "~/routes/perfume"

import MyScentsModal from "../../MyScentsModal/MyScentsModal"

const PerfumeComments = ({ userPerfume }) => {
  const { modalOpen, toggleModal, modalId } = use(SessionContext)
  const modalTrigger = useRef<HTMLButtonElement>(null)
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
          toggleModal(modalTrigger, 'add-scent', 'create')
        }}
        size={'sm'}> Create Comment</Button>

      {modalOpen && modalId === 'add-scent' && (
        <Modal>
          <MyScentsModal perfume={perfume} />
        </Modal>
      )}
    </div>
  )
}

export default PerfumeComments

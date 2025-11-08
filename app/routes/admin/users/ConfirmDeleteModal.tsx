import {
  type KeyboardEvent,
  type MouseEvent,
} from "react"

type DeleteType = "delete" | "soft-delete"

type ConfirmDeleteModalProps = {
  isOpen: boolean
  deleteType: DeleteType
  isSubmitting: boolean
  onConfirm: () => void
  onCancel: () => void
}

const getDeleteMessage = (deleteType: DeleteType) =>
  deleteType === "delete"
    ? "This will permanently delete the user and ALL their data. This action cannot be undone."
    : "This will mark the user as deleted but keep their data. The user will not be able to log in."

const getConfirmButtonClasses = (deleteType: DeleteType) =>
  deleteType === "delete"
    ? "bg-red-600 hover:bg-red-700"
    : "bg-yellow-600 hover:bg-yellow-700"

const ConfirmDeleteModal = ({
  isOpen,
  deleteType,
  isSubmitting,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) => {
  if (!isOpen) {
    return null
  }

  const handleOverlayInteraction = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel()
    }
  }

  const handleOverlayKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
      onCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
      role="button"
      tabIndex={0}
      aria-label="Close delete confirmation modal"
      onClick={handleOverlayInteraction}
      onKeyDown={handleOverlayKeyDown}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Confirm {deleteType === "delete" ? "Delete" : "Soft Delete"}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {getDeleteMessage(deleteType)}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-2 rounded-md text-white transition-colors ${getConfirmButtonClasses(deleteType)}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal


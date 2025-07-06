import { cx } from "class-variance-authority"
import { use, useRef } from "react"
import { useTranslation } from "react-i18next"
import { MdLibraryAdd } from "react-icons/md"

import { Button } from "~/components/Atoms/Button/Button"
import MyScentsModal from "~/components/Containers/MyScents/MyScentsModal/MyScentsModal"
import SessionContext from "~/providers/sessionProvider"
import type { PerfumeI } from "~/types"

import Modal from "../Modal/Modal"

interface AddToCollectionModalProps {
  type?: 'icon' | 'primary';
  perfume?: PerfumeI;
  className?: string;
}

const AddToCollectionModal =
  ({ type, perfume, className }: AddToCollectionModalProps) => {
    const { modalOpen, toggleModal, modalId } = use(SessionContext)
    const modalTrigger = useRef<HTMLButtonElement>(null)
    const { t } = useTranslation()
    const ButtonClasses = cx({
      [`z-50 ${className}`]: true,
      'bg-amber-400/60 hover:bg-amber-400/90 border-amber-600 hover:border-amber-700/90': type === 'icon',
    })
    return (
      <>
        <div>
          <Button
            variant={type}
            className={ButtonClasses}
            onClick={() => {
              toggleModal(modalTrigger, 'add-scent', 'create')
            }}
            ref={modalTrigger}
          >
            {type === 'icon' ?
              <div className="flex items-center gap-2">
                <span className="text-green-900 font-bold text-sm">{t('myScents.addButton')}</span>
                <MdLibraryAdd size={40} fill="green" />
              </div> :
              <p>{t('myScents.addButton')}</p>
            }
          </Button>
        </div>

        {modalOpen && modalId === 'add-scent' && (
          <Modal>
            <MyScentsModal perfume={perfume} />
          </Modal>
        )}
      </>
    )
  }
export default AddToCollectionModal

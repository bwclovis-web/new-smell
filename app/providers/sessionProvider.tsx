import { createContext, type ReactNode, type RefObject } from 'react'

// import useToast from '@/hooks/useToast'
import useModal from '~/hooks/useModal'

// interface ToastI {
//   message: string
//   type: 'error' | 'success' | 'warning' | 'info' | 'default'
// }

type SessionContextTypes = {
  modalOpen: boolean
  modalData?: any
  modalId: string | null
  // toastType: 'error' | 'success' | 'warning' | 'info' | 'default'
  // toastMessage: string
  toggleModal:
  // eslint-disable-next-line no-unused-vars
  (id: RefObject<HTMLButtonElement>, modalId: string, data?: any) => void
  // toggleToast: (data: ToastI) => void
  triggerId: RefObject<HTMLButtonElement>
  // showToast: boolean
}

const sessionCtxDefaults = {
  modalData: null,
  modalId: '',
  modalOpen: false,
  // showToast: false,
  // toastMessage: '',
  // toastType: 'default' as 'error' | 'success' | 'warning' | 'info' | 'default',
  toggleModal: (id?: RefObject<HTMLButtonElement> | undefined) => {
    id
  },
  // toggleToast: () => {
  // },
  triggerId: null as unknown as RefObject<HTMLButtonElement>
}

const SessionContext = createContext<SessionContextTypes>(sessionCtxDefaults)
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { toggleModal, modalOpen, triggerId, modalData, modalId } = useModal()
  // const { showToast, toggleToast, toastMessage, toastType } = useToast()

  return (
    <SessionContext.Provider
      value={{
        modalId,
        modalData,
        modalOpen,
        toggleModal,
        triggerId
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export default SessionContext

/* eslint-disable no-unused-vars */
import type { RefObject } from 'react'
import { useEffect } from 'react'
import { create } from 'zustand'

import { focusTrap } from '~/utils/focusTrap'

type ModalState = {
  isOpen: boolean
  modalId: string | null
  triggerId: RefObject<HTMLButtonElement> | null
  modalData: any
  toggleModal: (
    triggerId: RefObject<HTMLButtonElement>,
    modalId: string,
    data?: any
  ) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>(set => ({
  isOpen: false,
  modalId: null,
  triggerId: null,
  modalData: null,
  toggleModal: (triggerId, modalId, data = null) => {
    set(state => ({
      isOpen: !state.isOpen,
      triggerId,
      modalId,
      modalData: data || null
    }))
  },
  closeModal: () => set({
    isOpen: false,
    modalId: null,
    triggerId: null,
    modalData: null
  })
}))

/**
 * A hook that manages document overflow and focus trapping for modals
 * @param modalRef - Reference to the modal element for focus trapping
 */
export const useModalEffect = (modalRef: RefObject<HTMLDivElement | null>) => {
  const { isOpen, triggerId, closeModal } = useModalStore()

  useEffect(() => {
    const root = document.documentElement

    if (isOpen) {
      root.style.overflow = 'hidden'
    } else {
      root.style.overflow = 'auto'
      triggerId?.current?.focus()
    }

    return () => {
      root.style.overflow = 'auto'
    }
  }, [isOpen, triggerId])

  // Handle focus trap
  useEffect(() => {
    if (isOpen && modalRef.current && triggerId?.current) {
      focusTrap(modalRef.current, triggerId.current, closeModal)
    }
  }, [
    isOpen, modalRef, triggerId, closeModal
  ])
}

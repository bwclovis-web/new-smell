import { type RefObject, useEffect, useRef, useState } from 'react'

const UseModal = () => {
  const [modalOpen, setShowModal] = useState(false)
  const [triggerId, setTriggerId]
    = useState<RefObject<HTMLButtonElement>>(useRef<HTMLButtonElement>(null))
  const [modalId, setModalId] = useState<string | null>(null)
  const [modalData, setModalData] = useState<any>(null)

  const toggleModal
    = (id: RefObject<HTMLButtonElement>, modalId: string, data?: any) => {
      setShowModal(!modalOpen)
      if (id.current === null) {
        return
      }
      setTriggerId(id)
      setModalId(modalId)
      data ? setModalData(data) : setModalData(null)
    }

  useEffect(() => {
    const root = document.documentElement
    if (modalOpen) {
      root.style.overflow = 'hidden'
    } else {
      root.style.overflow = 'auto'
      triggerId.current?.focus()
    }
  }, [modalOpen, triggerId])

  return { modalId, modalOpen, toggleModal, triggerId, modalData }
}

export default UseModal

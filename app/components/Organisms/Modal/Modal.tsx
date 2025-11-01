import { type VariantProps } from "class-variance-authority"
import {
  type FC,
  type HTMLProps,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { IoMdCloseCircle } from "react-icons/io"

import { useSessionStore } from "~/stores/sessionStore"
import { styleMerge } from "~/utils/styleUtils"

import { modalBackgroundVariant, modalContentVariant } from "./modal-variants"

interface ModalProps
  extends HTMLProps<HTMLDivElement>,
    VariantProps<typeof modalBackgroundVariant>,
    VariantProps<typeof modalContentVariant> {
  children: ReactNode
}

const Modal: FC<ModalProps> = ({
  children,
  background,
  innerType,
  animateStart,
  ref,
}) => {
  const [mounted, setMounted] = useState(false)
  const [animate, setAnimate] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const { closeModal, modalOpen } = useSessionStore()

  const handleClick = () => {
    setAnimate(false)
    setTimeout(() => {
      closeModal()
    }, 60)
  }

  useLayoutEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Add animation effect only
  useEffect(() => {
    if (mounted) {
      setTimeout(() => {
        setAnimate(true)
      }, 140)
    }
  }, [mounted])

  const template = (
    <div
      ref={ref}
      id="modalContainer"
      className="fixed inset-0 z-[9999] flex justify-center items-center isolate"
      style={{ willChange: "opacity" }}
    >
      {modalOpen && (
        <div
          className={styleMerge(
            modalBackgroundVariant({
              animate,
              animateStart,
              background,
            })
          )}
          tabIndex={0}
          role="button"
          onClick={() => handleClick()}
          onKeyDown={(evt) => {
            if (evt.key === "Enter" || evt.key === " ") {
              evt.preventDefault()
              setAnimate(true)
              closeModal()
            }
          }}
          style={{ willChange: "opacity" }}
        />
      )}
      <div
        ref={modalRef}
        className={styleMerge(
          modalContentVariant({
            animate,
            animateStart,
            innerType,
          })
        )}
        style={{ willChange: "transform, opacity" }}
      >
        <button
          type="button"
          className="absolute top-5 right-5 max-w-max cursor-pointer"
          onClick={() => handleClick()}
        >
          <IoMdCloseCircle
            size={34}
            color="currentColor"
            className="fill-cyan-800"
          />
        </button>
        {children}
      </div>
    </div>
  )

  return mounted
    ? createPortal(template, document.querySelector("#modal-portal") as Element)
    : null
}

export default Modal

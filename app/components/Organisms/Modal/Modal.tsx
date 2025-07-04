
import { type VariantProps } from 'class-variance-authority'
import {
  type FC,
  type HTMLProps,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'
import { IoMdCloseCircle } from "react-icons/io"

import SessionContext from '~/providers/sessionProvider'
import { styleMerge } from '~/utils/styleUtils'

import { modalBackgroundVariant, modalContentVariant } from './modal-variants'

interface ModalProps
  extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof modalBackgroundVariant>,
  VariantProps<typeof modalContentVariant> {
  children: ReactNode
}

const Modal: FC<ModalProps>
  = ({ children, background, innerType, animateStart, ref }) => {
    const [mounted, setMounted] = useState(false)
    const [animate, setAnimate] = useState(false)
    const [windowPosition, setWindowPosition] = useState(0)
    const modalRef = useRef<HTMLDivElement>(null)
    const { toggleModal, triggerId } = useContext(SessionContext)
    const handleClick = () => {
      setAnimate(false)
      setTimeout(() => {
        if (triggerId) {
          toggleModal(triggerId, '')
        }
      }, 60)
    }

    useLayoutEffect(() => {
      const here = document.documentElement.scrollTop
      setWindowPosition(here)
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
    }, [mounted, windowPosition])

    const template = (
      <div
        ref={ref}
        id="modalContainer"
        className="absolute h-full w-full z-50 flex justify-center items-center"
      >
        <div
          className={styleMerge(modalBackgroundVariant({
            animate,
            animateStart,
            background
          }))}
          tabIndex={0}
          role="button"
          onClick={() => handleClick()}
          onKeyDown={evt => {
            if (evt.key === 'Enter' || evt.key === ' ') {
              evt.preventDefault()
              setAnimate(true)
              if (triggerId) {
                toggleModal(triggerId, '')
              }
            }
          }}
        />
        <div
          ref={modalRef}
          className={styleMerge(modalContentVariant({
            animate,
            animateStart,
            innerType
          }))}
        >
          <button
            type="button"
            className="absolute top-5 right-5 max-w-max cursor-pointer"
            onClick={() => handleClick()}
            aria-label='Close modal'
          >
            <IoMdCloseCircle size={34} color="currentColor" className='fill-noir-gold' />
          </button>
          {children}
        </div>
      </div>
    )

    return mounted
      ? createPortal(template, document.querySelector('#modal-portal') as Element)
      : null
  }

export default Modal

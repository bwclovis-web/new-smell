import { type FC, type RefObject } from 'react'
import { AiFillHome } from 'react-icons/ai'
import { FaBars } from 'react-icons/fa6'
import { NavLink } from 'react-router'

import { styleMerge } from '~/utils/styleUtils'

interface MobileHeaderProps {
  logoText: string
  menuButtonRef: RefObject<HTMLButtonElement>
  modalOpen: boolean
  modalId: string
  onMenuToggle: () => void
  onNavClick: () => void
}

const MobileHeader: FC<MobileHeaderProps> = ({
  logoText,
  menuButtonRef,
  modalOpen,
  modalId,
  onMenuToggle,
  onNavClick
}) => (
  <div className="flex justify-between items-center w-full py-4 px-4 mobile-safe-top bg-noir-dark/60 backdrop-blur-md">
    <NavLink
      to="/"
      className="text-noir-gold hover:text-noir-light font-semibold text-lg px-2 py-1 border border-transparent transition-colors duration-400 mobile-touch-target flex items-center"
      onClick={onNavClick}
    >
      <AiFillHome className="mr-2" size={20} />
      <span className="hidden sm:inline">{logoText}</span>
      <span className="sm:hidden">S&S</span>
    </NavLink>

    <button
      ref={menuButtonRef}
      onClick={onMenuToggle}
      className="text-noir-gold hover:text-noir-light p-3 transition-colors duration-200 mobile-touch-target rounded-lg hover:bg-noir-black/30"
      aria-label="Open menu"
      aria-expanded={modalOpen && modalId === 'mobile-navigation-menu'}
    >
      <FaBars size={24} />
    </button>
  </div>
)

export default MobileHeader

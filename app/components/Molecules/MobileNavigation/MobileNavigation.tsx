import { type FC, type HTMLProps, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AiFillHome } from 'react-icons/ai'
import { FaBars, FaUser } from 'react-icons/fa6'
import { LuSearch } from 'react-icons/lu'
import { NavLink } from 'react-router'

import Modal from '~/components/Organisms/Modal/Modal'
import { mainNavigation } from '~/data/navigation'
import SessionContext from '~/providers/sessionProvider'
import { ROUTE_PATH as ADMIN_PATH } from '~/routes/admin/profilePage'
import { ROUTE_PATH as SIGN_IN } from '~/routes/login/SignInPage'
import { styleMerge } from '~/utils/styleUtils'

import LogoutButton from '../LogoutButton/LogoutButton'

interface MobileNavigationProps extends HTMLProps<HTMLDivElement> {
  user?: {
    id?: string
    role?: string
  } | null
  onMenuClose?: () => void
}

const MobileNavigation: FC<MobileNavigationProps> = ({
  className,
  user,
  onMenuClose
}) => {
  const { t, ready } = useTranslation()
  const [isClientReady, setIsClientReady] = useState(false)
  const { toggleModal, modalOpen, modalId } = useContext(SessionContext)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const MOBILE_MENU_ID = 'mobile-navigation-menu'

  // Ensure client-side hydration consistency
  useEffect(() => {
    setIsClientReady(true)
  }, [])

  // Close menu when route changes
  const handleNavClick = () => {
    toggleModal(menuButtonRef, MOBILE_MENU_ID)
    onMenuClose?.()
  }

  const logoText = ready && isClientReady ? t('navigation.logo') : 'Shadow and Sillage'

  return (
    <div className={styleMerge('mobile-nav md:hidden', className)}>
      {/* Mobile Header */}
      <div className="flex justify-between items-center w-full py-4 px-4 mobile-safe-top bg-noir-dark/60 backdrop-blur-md">
        <NavLink
          to="/"
          className="text-noir-gold hover:text-noir-light font-semibold text-lg px-2 py-1 border border-transparent transition-colors duration-400 mobile-touch-target flex items-center"
          onClick={handleNavClick}
        >
          <AiFillHome className="mr-2" size={20} />
          <span className="hidden sm:inline">{logoText}</span>
          <span className="sm:hidden">S&S</span>
        </NavLink>

        <button
          ref={menuButtonRef}
          onClick={() => {
            toggleModal(menuButtonRef, MOBILE_MENU_ID)
          }}
          className="text-noir-gold hover:text-noir-light p-3 transition-colors duration-200 mobile-touch-target rounded-lg hover:bg-noir-black/30"
          aria-label="Open menu"
          aria-expanded={modalOpen && modalId === MOBILE_MENU_ID}
        >
          <FaBars size={24} />
        </button>
      </div>

      {/* Mobile Menu Modal */}
      {modalOpen && modalId === MOBILE_MENU_ID && (
        <Modal
          animateStart="left"
          background="default"
          innerType="dark"
        >
          <div className="flex flex-col h-full mobile-safe-top mobile-safe-bottom pointer-events-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-noir-light/20 mb-6">
              <h2 className="text-noir-gold font-semibold text-xl">Menu</h2>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4">
              <ul className="space-y-2">
                {mainNavigation.map(item => (
                  <li key={item.id}>
                    <NavLink
                      viewTransition
                      to={item.path}
                      onClick={handleNavClick}
                      className={({ isActive }) => styleMerge(
                        'block text-noir-gold hover:text-noir-light font-semibold text-lg py-4 px-4 border border-transparent transition-colors duration-400 rounded-lg mobile-touch-target hover:bg-noir-black/30',
                        isActive && isClientReady && 'text-noir-light bg-noir-black/30 border-noir-light/90',
                      )}
                    >
                      {ready && isClientReady ? t('navigation.' + item.key) : item.label}
                    </NavLink>
                  </li>
                ))}

                {user && (
                  <li>
                    <NavLink
                      viewTransition
                      to={ADMIN_PATH}
                      onClick={handleNavClick}
                      className={({ isActive }) => styleMerge(
                        'block text-noir-gold hover:text-noir-light font-semibold text-lg py-4 px-4 border border-transparent transition-colors duration-400 rounded-lg mobile-touch-target hover:bg-noir-black/30',
                        isActive && isClientReady && 'text-noir-light bg-noir-gold rounded-lg border-noir-light/90',
                      )}
                    >
                      {ready && isClientReady ? t('navigation.admin') : 'Admin'}
                    </NavLink>
                  </li>
                )}
              </ul>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-noir-light/20 mt-6">
              {!user ? (
                <NavLink
                  viewTransition
                  to={SIGN_IN}
                  onClick={handleNavClick}
                  className="flex items-center gap-3 text-noir-gold hover:text-noir-light font-semibold text-lg py-4 px-4 border border-transparent transition-colors duration-400 rounded-lg hover:bg-noir-black/30 mobile-touch-target"
                >
                  <FaUser size={20} />
                  <span>Sign In</span>
                </NavLink>
              ) : (
                <div className="flex items-center gap-3">
                  <FaUser size={20} className="text-noir-gold" />
                  <LogoutButton />
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-noir-light/20">
              <div className="grid grid-cols-2 gap-3">
                <NavLink
                  to="/"
                  onClick={handleNavClick}
                  className="flex flex-col items-center gap-2 text-noir-gold hover:text-noir-light p-3 rounded-lg hover:bg-noir-black/30 mobile-touch-target transition-colors duration-200"
                >
                  <AiFillHome size={20} />
                  <span className="text-sm font-medium">Home</span>
                </NavLink>
                <button
                  onClick={() => {
                    // Focus on search if available, or navigate to search page
                    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]') as HTMLInputElement
                    if (searchInput) {
                      searchInput.focus()
                      handleNavClick()
                    }
                  }}
                  className="flex flex-col items-center gap-2 text-noir-gold hover:text-noir-light p-3 rounded-lg hover:bg-noir-black/30 mobile-touch-target transition-colors duration-200"
                >
                  <LuSearch size={20} />
                  <span className="text-sm font-medium">Search</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MobileNavigation

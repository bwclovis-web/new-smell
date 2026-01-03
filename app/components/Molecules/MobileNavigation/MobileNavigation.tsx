import { type HTMLProps, type RefObject, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import AdminNavigation from "~/components/Molecules/AdminNavigation/AdminNavigation"
import Modal from "~/components/Organisms/Modal"
import { useSessionStore } from "~/stores/sessionStore"
import { styleMerge } from "~/utils/styleUtils"

import MobileHeader from "./components/MobileHeader"
import NavigationLinks from "./components/NavigationLinks"
import QuickActions from "./components/QuickActions"
import UserSection from "./components/UserSection"

interface MobileNavigationProps extends HTMLProps<HTMLDivElement> {
  user?: {
    id?: string
    role?: string
  } | null
  onMenuClose?: () => void
}

const MobileNavigation = ({
  className,
  user,
  onMenuClose,
}: MobileNavigationProps) => {
  const { t, ready } = useTranslation()
  const [isClientReady, setIsClientReady] = useState(false)
  const { toggleModal, modalOpen, modalId } = useSessionStore()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const adminMenuButtonRef = useRef<HTMLButtonElement>(null)
  const MOBILE_MENU_ID = "mobile-navigation-menu"
  const ADMIN_MENU_ID = "admin-navigation-menu"

  // Ensure client-side hydration consistency
  useEffect(() => {
    setIsClientReady(true)
  }, [])

  // Close menu when route changes
  const handleNavClick = () => {
    toggleModal(menuButtonRef as RefObject<HTMLButtonElement>, MOBILE_MENU_ID)
    onMenuClose?.()
  }

  const handleMenuToggle = () => {
    toggleModal(menuButtonRef as RefObject<HTMLButtonElement>, MOBILE_MENU_ID)
  }

  const handleAdminMenuToggle = () => {
    toggleModal(adminMenuButtonRef as RefObject<HTMLButtonElement>, ADMIN_MENU_ID)
  }

  const handleAdminNavClick = () => {
    toggleModal(adminMenuButtonRef as RefObject<HTMLButtonElement>, ADMIN_MENU_ID)
    onMenuClose?.()
  }

  const logoText =
    ready && isClientReady ? t("navigation.logo") : "Shadow and Sillage"

  return (
    <div className={styleMerge("mobile-nav lg:hidden fixed w-full z-30", className)}>
      <MobileHeader
        logoText={logoText}
        menuButtonRef={menuButtonRef as RefObject<HTMLButtonElement>}
        modalOpen={modalOpen}
        modalId={MOBILE_MENU_ID}
        onMenuToggle={handleMenuToggle}
        onNavClick={handleNavClick}
      />

      {/* Mobile Menu Modal */}
      {modalOpen && modalId === MOBILE_MENU_ID && (
        <Modal animateStart="left" background="default" innerType="dark">
          <div className="flex flex-col w-full h-full max-h-[90vh] pointer-events-auto overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-noir-gold-500/20 mb-4 sticky top-0 bg-noir-black/95 backdrop-blur-sm">
              <h2 className="text-noir-gold font-semibold text-xl">{t("navigation.menu")}</h2>
            </div>

            {/* Navigation Links */}
            <NavigationLinks
              user={user}
              isClientReady={isClientReady}
              onNavClick={handleNavClick}
              onAdminMenuToggle={handleAdminMenuToggle}
              adminMenuButtonRef={adminMenuButtonRef as RefObject<HTMLButtonElement>}
            />

            {/* User Section */}
            <UserSection user={user} onNavClick={handleNavClick} />

            {/* Quick Actions */}
            <QuickActions onNavClick={handleNavClick} />
          </div>
        </Modal>
      )}

      {/* Admin Navigation Modal */}
      {modalOpen && modalId === ADMIN_MENU_ID && (
        <Modal animateStart="left" background="default" innerType="dark">
          <div className="flex flex-col w-full h-full max-h-[90vh] pointer-events-auto overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-noir-gold-500/20 mb-4 sticky top-0 bg-noir-black/95 backdrop-blur-sm">
              <h2 className="text-noir-gold font-semibold text-xl">
                {ready && isClientReady ? t("navigation.admin") : "Admin"}
              </h2>
            </div>

            {/* Admin Navigation */}
            <div className="flex-1 px-4 pb-4">
              <AdminNavigation user={user || undefined} onNavClick={handleAdminNavClick} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MobileNavigation

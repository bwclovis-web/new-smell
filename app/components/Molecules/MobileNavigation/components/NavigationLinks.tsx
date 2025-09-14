import { type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { mainNavigation } from '~/data/navigation'
import { ROUTE_PATH as ADMIN_PATH } from '~/routes/admin/profilePage'
import { styleMerge } from '~/utils/styleUtils'

interface NavigationLinksProps {
  user?: {
    id?: string
    role?: string
  } | null
  isClientReady: boolean
  onNavClick: () => void
}

const NavigationLinks: FC<NavigationLinksProps> = ({
  user,
  isClientReady,
  onNavClick
}) => {
  const { t, ready } = useTranslation()

  return (
    <nav className="flex-1 px-4 pb-4">
      <ul className="space-y-2">
        {mainNavigation.map(item => (
          <li key={item.id}>
            <NavLink
              viewTransition
              to={item.path}
              onClick={onNavClick}
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
              onClick={onNavClick}
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
  )
}

export default NavigationLinks

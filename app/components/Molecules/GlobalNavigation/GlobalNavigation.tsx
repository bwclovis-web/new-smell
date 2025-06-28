import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, useEffect, useState } from 'react'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { mainNavigation } from '~/data/navigation'
import { ROUTE_PATH as ADMIN_PATH } from '~/routes/admin/ProfilePage'
import { ROUTE_PATH as SIGN_IN } from '~/routes/login/SignInPage'
import { styleMerge } from '~/utils/styleUtils'

import LogoutButton from '../LogoutButton/LogoutButton'
import { globalNavigationVariants } from './globalNavigation-variants'

interface GlobalNavigationProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof globalNavigationVariants> {
  user?: {
    id?: string
    role?: string
  } | null
}

const GlobalNavigationContent: FC<GlobalNavigationProps> = ({ className, user }) => {
  const { t, ready } = useTranslation()
  const [isClientReady, setIsClientReady] = useState(false)

  // Ensure client-side hydration consistency
  useEffect(() => {
    setIsClientReady(true)
  }, [])
  const logoText = ready && isClientReady ? t('navigation.logo') : ' Good Scents'

  return (
    <nav className={styleMerge(globalNavigationVariants({ className }))} data-cy="GlobalNavigation">
      <NavLink to="/" className="text-noir-dark text-2xl font-bold text-center max-w-max">
        {logoText}
      </NavLink>
      <ul className="flex gap-4">
        {mainNavigation.map(item => (
          <li key={item.id}>
            <NavLink
              viewTransition
              to={item.path}
              className={({ isActive }) => styleMerge(
                'text-noir-dark hover:text-gray-300 font-semibold text-lg',
                isActive && isClientReady ? 'text-gray-300' : ''
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
              className={({ isActive }) => styleMerge(
                'text-noir-dark hover:text-gray-300 font-semibold text-lg',
                isActive && isClientReady ? 'text-gray-300' : ''
              )}
            >
              {ready && isClientReady ? t('navigation.admin') : 'Admin'}
            </NavLink>
          </li>
        )}
        <li>
          {!user
            ? (
              <NavLink
                viewTransition
                to={SIGN_IN}
                className={({ isActive }) => styleMerge(
                  'text-white hover:text-gray-300',
                  isActive && isClientReady ? 'text-gray-300' : ''
                )}
              >
                Sign In
              </NavLink>
            )
            : <LogoutButton />}
        </li>
      </ul>
    </nav>
  )
}

const GlobalNavigation: FC<GlobalNavigationProps> = props => (
  <Suspense fallback={<div>Loading...</div>}>
    <GlobalNavigationContent {...props} />
  </Suspense>
)

export default GlobalNavigation
